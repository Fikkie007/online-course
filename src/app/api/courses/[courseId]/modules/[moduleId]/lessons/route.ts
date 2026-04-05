import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';

const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  content_type: z.enum(['video', 'document', 'quiz']).default('video'),
  content_url: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional().nullable(),
  order_index: z.number().int().min(0).optional(),
  is_preview: z.boolean().default(false),
});

// GET - List lessons for a module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    const supabase = createAdminClient();
    const user = await getCurrentUser();

    // Check enrollment
    let isEnrolled = false;
    if (user) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .single();
      isEnrolled = !!enrollment;
    }

    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Filter content_url based on enrollment
    const filteredData = data?.map(lesson => ({
      ...lesson,
      content_url: (isEnrolled || lesson.is_preview) ? lesson.content_url : null,
    }));

    return NextResponse.json({ success: true, data: filteredData });
  } catch (error) {
    console.error('Lessons list error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create lesson (course owner or admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Verify module belongs to course
    const { data: module } = await supabase
      .from('modules')
      .select('id, course_id')
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .single();

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Check course ownership
    const { data: course } = await supabase
      .from('courses')
      .select('mentor_id')
      .eq('id', courseId)
      .single();

    const canModify = course?.mentor_id === user.id || await isAdmin();
    if (!canModify) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createLessonSchema.parse(body);

    // Get max order_index if not provided
    if (!validatedData.order_index) {
      const { data: lastLesson } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      validatedData.order_index = (lastLesson?.order_index || 0) + 1;
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        ...validatedData,
        module_id: moduleId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Lesson create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}