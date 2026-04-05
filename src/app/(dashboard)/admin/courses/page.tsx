import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminCoursesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdm = await isAdmin();
  if (!isAdm) {
    redirect('/student');
  }

  const params = await searchParams;
  const statusFilter = params.status;

  const supabase = createAdminClient();

  // Get all courses with mentor info
  let query = supabase
    .from('courses')
    .select(`
      *,
      mentor:profiles!courses_mentor_id_fkey(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: courses } = await query;

  // Get stats
  const { count: totalCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });

  const { count: publishedCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: draftCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');

  const { count: archivedCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'archived');

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Kelola Kursus</h1>
        <Link href="/admin/courses/create">
          <Button>Tambah Kursus</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-blue-600">{totalCourses || 0}</div>
          <div className="text-sm text-muted-foreground">Total Kursus</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-green-600">{publishedCourses || 0}</div>
          <div className="text-sm text-muted-foreground">Dipublikasi</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-yellow-600">{draftCourses || 0}</div>
          <div className="text-sm text-muted-foreground">Draft</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-gray-600">{archivedCourses || 0}</div>
          <div className="text-sm text-muted-foreground">Diarsipkan</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Link href="/admin/courses">
          <Button variant={!statusFilter ? 'default' : 'outline'} size="sm">
            Semua
          </Button>
        </Link>
        <Link href="/admin/courses?status=published">
          <Button variant={statusFilter === 'published' ? 'default' : 'outline'} size="sm">
            Dipublikasi
          </Button>
        </Link>
        <Link href="/admin/courses?status=draft">
          <Button variant={statusFilter === 'draft' ? 'default' : 'outline'} size="sm">
            Draft
          </Button>
        </Link>
        <Link href="/admin/courses?status=archived">
          <Button variant={statusFilter === 'archived' ? 'default' : 'outline'} size="sm">
            Diarsipkan
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Mentor</th>
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
                    <div className="flex items-center gap-3">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-12 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="font-medium">{course.mentor?.full_name || '-'}</div>
                      <div className="text-muted-foreground text-xs">{course.mentor?.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : course.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.status === 'published'
                        ? 'Dipublikasi'
                        : course.status === 'draft'
                        ? 'Draft'
                        : 'Diarsipkan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      {course.discount_price && course.discount_price < course.price ? (
                        <>
                          <div className="font-medium">
                            Rp {course.discount_price.toLocaleString('id-ID')}
                          </div>
                          <div className="text-xs text-muted-foreground line-through">
                            Rp {course.price.toLocaleString('id-ID')}
                          </div>
                        </>
                      ) : course.price === 0 ? (
                        <span className="text-green-600 font-medium">Gratis</span>
                      ) : (
                        <span>Rp {course.price.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>{course.total_students || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/courses/${course.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Tidak ada kursus ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}