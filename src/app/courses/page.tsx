import { createAdminClient } from '@/lib/supabase/admin';
import { CourseCard } from '@/components/course';
import { SortSelect } from '@/components/courses/SortSelect';
import { Course, Category } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Extended type for courses with categories relation
type CourseWithCategories = Course & {
  categories?: { category: Category }[];
};

interface CoursesPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const page = parseInt(params.page || '1');
  const categorySlug = params.category || 'all';
  const sort = params.sort || 'newest';

  const supabase = createAdminClient();

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  // Find selected category
  const selectedCategory = categories?.find((c) => c.slug === categorySlug);
  const selectedCategoryId = selectedCategory?.id;

  // Build query
  let query = supabase
    .from('courses')
    .select(`
      *,
      mentor:profiles!courses_mentor_id_fkey(id, full_name, avatar_url),
      categories:course_categories(
        category:categories(id, name, slug, icon)
      )
    `)
    .eq('status', 'published');

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply category filter using junction table
  if (selectedCategoryId) {
    // Get course IDs that have this category
    const { data: courseCategories } = await supabase
      .from('course_categories')
      .select('course_id')
      .eq('category_id', selectedCategoryId);

    const courseIds = courseCategories?.map((cc) => cc.course_id) || [];
    if (courseIds.length > 0) {
      query = query.in('id', courseIds);
    } else {
      // No courses with this category - return empty
      query = query.limit(0);
    }
  }

  // Apply sorting
  switch (sort) {
    case 'popular':
      query = query.order('total_students', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'price-low':
      query = query.order('price', { ascending: true });
      break;
    case 'price-high':
      query = query.order('price', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  if (search) {
    countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (selectedCategoryId) {
    // Get course IDs that have this category
    const { data: courseCategoriesForCount } = await supabase
      .from('course_categories')
      .select('course_id')
      .eq('category_id', selectedCategoryId);

    const courseIdsForCount = courseCategoriesForCount?.map((cc) => cc.course_id) || [];
    if (courseIdsForCount.length > 0) {
      countQuery = countQuery.in('id', courseIdsForCount);
    } else {
      countQuery = countQuery.limit(0);
    }
  }

  const { count } = await countQuery;

  // Pagination
  const pageSize = 12;
  const totalPages = Math.ceil((count || 0) / pageSize);

  const { data: courses, error } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );

  if (error) {
    console.error('Error fetching courses:', error);
  }

  // Build URL for pagination/filters
  const buildUrl = (newPage: number, newCategory?: string, newSort?: string) => {
    const urlParams = new URLSearchParams();
    if (search) urlParams.set('search', search);
    if (newPage > 1) urlParams.set('page', newPage.toString());
    if (newCategory && newCategory !== 'all') urlParams.set('category', newCategory);
    if (newSort && newSort !== 'newest') urlParams.set('sort', newSort);
    const queryString = urlParams.toString();
    return queryString ? `/courses?${queryString}` : '/courses';
  };

  // All categories option + database categories
  const allCategories = [
    { id: 'all', name: 'Semua', slug: 'all', icon: '📚' },
    ...(categories || []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Katalog Kursus</h1>
            <p className="text-lg opacity-90 mb-6">
              Temukan kursus terbaik untuk meningkatkan skill Anda
            </p>

            {/* Search */}
            <form method="get" className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Cari kursus..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                  />
                </div>
                <Button
                  type="submit"
                  className="px-6 py-3 bg-white text-primary rounded-xl font-medium hover:bg-white/90 shadow-lg"
                >
                  Cari
                </Button>
              </div>
              {/* Preserve category and sort in search form */}
              {categorySlug !== 'all' && <input type="hidden" name="category" value={categorySlug} />}
              {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filters & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={buildUrl(1, cat.slug, sort)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categorySlug === cat.slug
                    ? 'bg-primary text-white'
                    : 'bg-white border hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <span className="mr-1">{cat.icon || '📚'}</span>
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Sort Dropdown */}
          <SortSelect currentSort={sort} search={search} category={categorySlug} />
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {search ? (
              <>
                Menampilkan <span className="font-medium text-foreground">{courses?.length || 0}</span> dari{' '}
                <span className="font-medium text-foreground">{count || 0}</span> kursus untuk "{search}"
              </>
            ) : (
              <>
                Total <span className="font-medium text-foreground">{count || 0}</span> kursus tersedia
              </>
            )}
          </p>

          {/* Clear filters */}
          {(search || categorySlug !== 'all') && (
            <Link
              href="/courses"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset filter
            </Link>
          )}
        </div>

        {/* Course Grid */}
        {courses && courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course: CourseWithCategories) => {
                // Transform categories from junction table
                const courseWithCategories = {
                  ...course,
                  categories: course.categories?.map((cc) => cc.category) || [],
                };
                return <CourseCard key={course.id} course={courseWithCategories} />;
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Prev button */}
                {page > 1 ? (
                  <Link
                    href={buildUrl(page - 1, categorySlug, sort)}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Sebelumnya
                  </Link>
                ) : (
                  <div className="px-4 py-2 bg-gray-100 border rounded-lg text-muted-foreground flex items-center gap-2 cursor-not-allowed">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Sebelumnya
                  </div>
                )}

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {page > 3 && (
                    <>
                      <Link
                        href={buildUrl(1, categorySlug, sort)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border hover:bg-primary hover:text-white"
                      >
                        1
                      </Link>
                      {page > 4 && <span className="px-2 text-muted-foreground">...</span>}
                    </>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 5) return true;
                      if (p === 1 || p === totalPages) return false;
                      return Math.abs(p - page) <= 1;
                    })
                    .map((p) => (
                      <Link
                        key={p}
                        href={buildUrl(p, categorySlug, sort)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                          p === page
                            ? 'bg-primary text-white'
                            : 'bg-white border hover:bg-primary hover:text-white'
                        }`}
                      >
                        {p}
                      </Link>
                    ))}

                  {page < totalPages - 2 && (
                    <>
                      {page < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                      <Link
                        href={buildUrl(totalPages, categorySlug, sort)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border hover:bg-primary hover:text-white"
                      >
                        {totalPages}
                      </Link>
                    </>
                  )}
                </div>

                {/* Next button */}
                {page < totalPages ? (
                  <Link
                    href={buildUrl(page + 1, categorySlug, sort)}
                    className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    Selanjutnya
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div className="px-4 py-2 bg-gray-100 border rounded-lg text-muted-foreground flex items-center gap-2 cursor-not-allowed">
                    Selanjutnya
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Kursus Tidak Ditemukan</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {search
                ? `Tidak ada kursus yang cocok dengan pencarian "${search}". Coba kata kunci lain atau jelajahi kategori lain.`
                : 'Belum ada kursus tersedia saat ini. Silakan kembali lagi nanti.'}
            </p>
            {(search || categorySlug !== 'all') && (
              <Link href="/courses">
                <Button size="lg">Reset Filter</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}