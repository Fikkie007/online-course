import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';

const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content_type: z.enum(['video', 'document', 'quiz']).optional(),
  content_url: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional().nullable(),
  order_index: z.number().int().min(0).optional(),
  is_preview: z.boolean().optional(),
});

// PATCH - Update lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { courseId, moduleId, lessonId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Check course ownership
    const { data: course } = await supabase
      .from('courses')
      .select('mentor_id')
      .eq('id', courseId)
      .single();

    const isOwner = course?.mentor_id === user.id;
    const isAdm = await isAdmin();

    if (!isOwner && !isAdm) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateLessonSchema.parse(body);

    // Verify lesson belongs to module and course
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, module_id')
      .eq('id', lessonId)
      .eq('module_id', moduleId)
      .single();

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(validatedData)
      .eq('id', lessonId)
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
    console.error('Lesson update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }
) {
  try {
    const { courseId, moduleId, lessonId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Check course ownership
    const { data: course } = await supabase
      .from('courses')
      .select('mentor_id')
      .eq('id', courseId)
      .single();

    const isOwner = course?.mentor_id === user.id;
    const isAdm = await isAdmin();

    if (!isOwner && !isAdm) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
      .eq('module_id', moduleId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lesson delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
