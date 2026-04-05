import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';

const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  order_index: z.number().int().min(0).optional(),
});

// GET - List modules for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('modules')
      .select(`
        *,
        lessons (
          id,
          title,
          content_type,
          content_url,
          duration_minutes,
          order_index,
          is_preview
        )
      `)
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Modules list error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
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
    const validatedData = createModuleSchema.parse(body);

    // Get max order_index if not provided
    if (!validatedData.order_index) {
      const { data: lastModule } = await supabase
        .from('modules')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      validatedData.order_index = (lastModule?.order_index || 0) + 1;
    }

    const { data, error } = await supabase
      .from('modules')
      .insert({
        ...validatedData,
        course_id: courseId,
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
    console.error('Module create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}