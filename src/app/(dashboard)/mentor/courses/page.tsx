import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isMentor, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MentorCoursesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function MentorCoursesPage({ searchParams }: MentorCoursesPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const canAccess = await isMentor();
  if (!canAccess) {
    redirect('/student');
  }

  const params = await searchParams;
  const statusFilter = params.status;

  const supabase = createAdminClient();

  // Get mentor's courses
  let query = supabase
    .from('courses')
    .select(`
      *,
      mentor:profiles!courses_mentor_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  // If not admin, only show own courses
  const isAdm = await isAdmin();
  if (!isAdm) {
    query = query.eq('mentor_id', user.id);
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: courses } = await query;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Kelola Kursus</h1>
        <Link href="/mentor/courses/create">
          <Button>Buat Kursus Baru</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Link href="/mentor/courses">
          <Button variant={!statusFilter ? 'default' : 'outline'} size="sm">
            Semua
          </Button>
        </Link>
        <Link href="/mentor/courses?status=draft">
          <Button variant={statusFilter === 'draft' ? 'default' : 'outline'} size="sm">
            Draft
          </Button>
        </Link>
        <Link href="/mentor/courses?status=published">
          <Button variant={statusFilter === 'published' ? 'default' : 'outline'} size="sm">
            Dipublikasi
          </Button>
        </Link>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {courses && courses.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Judul</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Harga</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Siswa</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{course.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {course.status === 'published' ? 'Dipublikasi' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    Rp {course.price.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">{course.total_students}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/mentor/courses/${course.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Tidak ada kursus ditemukan. Buat kursus pertama Anda!
          </div>
        )}
      </div>
    </div>
  );
}