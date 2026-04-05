import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';
import { Lesson } from '@/types';

// Schema for course update
const updateCourseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  price: z.number().min(0).optional(),
  discount_price: z.number().min(0).optional().nullable(),
  duration_hours: z.number().int().min(0).optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// GET - Course detail with modules and lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = createAdminClient();
    const user = await getCurrentUser();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        mentor:profiles!courses_mentor_id_fkey(id, full_name, avatar_url, email),
        categories:course_categories(
          category:categories(id, name, slug, icon)
        )
      `)
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Transform categories
    const courseWithCategories = {
      ...course,
      categories: course.categories?.map((cc: any) => cc.category) || [],
      category_ids: course.categories?.map((cc: any) => cc.category.id) || [],
    };

    // Check if user is enrolled (for lesson access)
    let isEnrolled = false;
    if (user) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .single();
      isEnrolled = !!enrollment;
    }

    // Get modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        lessons (
          id,
          title,
          content_type,
          duration_minutes,
          order_index,
          is_preview
        )
      `)
      .eq('course_id', courseId)
      .order('order_index');

    if (modulesError) {
      return NextResponse.json(
        { success: false, error: modulesError.message },
        { status: 500 }
      );
    }

    // Filter lessons: show content_url only for enrolled users or preview lessons
    const modulesWithFilteredLessons = modules?.map(module => ({
      ...module,
      lessons: module.lessons?.map((lesson: Lesson) => ({
        ...lesson,
        content_url: (isEnrolled || lesson.is_preview) ? lesson.content_url : null,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...courseWithCategories,
        modules: modulesWithFilteredLessons,
        isEnrolled,
      },
    });
  } catch (error) {
    console.error('Course detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update course (mentor owner or admin)
export async function PATCH(
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

    // Check if course exists and user is owner or admin
    const { data: course } = await supabase
      .from('courses')
      .select('mentor_id')
      .eq('id', courseId)
      .single();

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const isOwner = course.mentor_id === user.id;
    const isAdm = await isAdmin();

    if (!isOwner && !isAdm) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category_ids, ...validatedData } = updateCourseSchema.parse(body);

    // Update slug if title changed
    if (validatedData.title) {
      const slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: existingSlug } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .neq('id', courseId)
        .single();

      if (existingSlug) {
        validatedData.title = `${validatedData.title} (${Date.now()})`;
      } else {
        await supabase
          .from('courses')
          .update({ slug })
          .eq('id', courseId);
      }
    }

    // Update course
    const { data, error } = await supabase
      .from('courses')
      .update(validatedData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Update categories if provided
    if (category_ids !== undefined) {
      // Delete existing categories
      await supabase
        .from('course_categories')
        .delete()
        .eq('course_id', courseId);

      // Insert new categories
      if (category_ids.length > 0) {
        const categoryInserts = category_ids.map((catId: string) => ({
          course_id: courseId,
          category_id: catId,
        }));

        const { error: categoryError } = await supabase
          .from('course_categories')
          .insert(categoryInserts);

        if (categoryError) {
          console.error('Failed to update categories:', categoryError);
        }
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Course update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete course (admin only)
export async function DELETE(
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

    const isAdm = await isAdmin();
    if (!isAdm) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}