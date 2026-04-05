import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CategoriesList } from './CategoriesList';
import { CategoryForm } from './CategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const admin = await isAdmin();
  if (!admin) {
    redirect('/student');
  }

  const supabase = createAdminClient();

  // Get all categories with course count
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  // Get course count per category
  const { data: courseCounts } = await supabase
    .from('courses')
    .select('category_id');

  // Count courses per category
  const countMap: Record<string, number> = {};
  courseCounts?.forEach((course) => {
    if (course.category_id) {
      countMap[course.category_id] = (countMap[course.category_id] || 0) + 1;
    }
  });

  const categoriesWithCount = categories?.map((cat) => ({
    ...cat,
    course_count: countMap[cat.id] || 0,
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Kelola Kategori</h1>
      </div>

      <div className="max-w-4xl">
        {/* Add Category Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Tambah Kategori Baru</h2>
          <CategoryForm />
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Daftar Kategori</h2>
          </div>
          {categoriesWithCount && categoriesWithCount.length > 0 ? (
            <CategoriesList categories={categoriesWithCount} />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Belum ada kategori. Tambahkan kategori pertama Anda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}