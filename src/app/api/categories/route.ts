import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { cached, CACHE_TTL, invalidateCache } from '@/lib/cache';

// Cache key for categories
const CATEGORIES_CACHE_KEY = 'categories:all';

// GET - List all categories (public, cached)
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    const bypass = searchParams.get('bypass') === 'true';

    // Use cached wrapper for categories
    const categories = await cached(
      CATEGORIES_CACHE_KEY,
      async () => {
        const supabase = createAdminClient();

        let query = supabase
          .from('categories')
          .select('*')
          .order('order_index', { ascending: true });

        // Note: is_active filter applied after cache if needed
        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        return data || [];
      },
      { ttl: CACHE_TTL.CATEGORIES, bypass }
    );

    // Filter active if requested (done in-memory since we cache all)
    const filteredCategories = activeOnly
      ? categories.filter((c: any) => c.is_active !== false)
      : categories;

    return NextResponse.json({ success: true, data: filteredCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, icon, description, order_index } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        icon: icon || '📚',
        description,
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate categories cache after creation
    await invalidateCache(CATEGORIES_CACHE_KEY);

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}