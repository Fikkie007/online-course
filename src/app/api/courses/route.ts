import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isMentor, isAdmin } from '@/lib/auth';
import { z } from 'zod';

// Schema for course creation
const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  price: z.number().min(0).default(0),
  discount_price: z.number().min(0).optional().nullable(),
  duration_hours: z.number().int().min(0).optional().nullable(),
});

// GET - List all published courses
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const categorySlug = searchParams.get('category');

    let query = supabase
      .from('courses')
      .select(`
        *,
        mentor:profiles!courses_mentor_id_fkey(id, full_name, avatar_url),
        categories:course_categories(
          category:categories(id, name, slug, icon)
        )
      `)
      .range((page - 1) * pageSize, page * pageSize - 1);

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'published');
    }

    // Search by title
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Filter by category slug
    if (categorySlug) {
      // Get category ID from slug
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (category) {
        // Get course IDs that have this category
        const { data: courseCategories } = await supabase
          .from('course_categories')
          .select('course_id')
          .eq('category_id', category.id);

        const courseIds = courseCategories?.map((cc) => cc.course_id) || [];
        if (courseIds.length > 0) {
          query = query.in('id', courseIds);
        } else {
          // No courses with this category
          return NextResponse.json({
            success: true,
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          });
        }
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform categories from junction table
    const coursesWithCategories = data?.map((course) => ({
      ...course,
      categories: course.categories?.map((cc: any) => cc.category) || [],
    }));

    // Get total count
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', status || 'published');

    return NextResponse.json({
      success: true,
      data: coursesWithCategories,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Courses list error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new course (mentor/admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const canCreate = await isMentor();
    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Mentor or Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category_ids, ...validatedData } = createCourseSchema.parse(body);

    // Generate slug from title
    const slug = validatedData.title!
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const supabase = createAdminClient();

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    const uniqueSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Create course
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...validatedData,
        slug: uniqueSlug,
        mentor_id: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Add categories if provided
    if (category_ids && category_ids.length > 0) {
      const categoryInserts = category_ids.map((catId: string) => ({
        course_id: data.id,
        category_id: catId,
      }));

      const { error: categoryError } = await supabase
        .from('course_categories')
        .insert(categoryInserts);

      if (categoryError) {
        console.error('Failed to add categories:', categoryError);
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
    console.error('Course create error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}