import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isMentor } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function MentorDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const canAccess = await isMentor();
  if (!canAccess) {
    redirect('/student');
  }

  const supabase = createAdminClient();

  // Get mentor stats
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, status, total_students, price, created_at')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false });

  // Calculate stats
  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter((c) => c.status === 'published').length || 0;
  const totalStudents = courses?.reduce((sum, c) => sum + (c.total_students || 0), 0) || 0;

  // Get revenue
  const courseIds = courses?.map((c) => c.id) || [];
  let totalRevenue = 0;

  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .in('course_id', courseIds);

    const enrollmentIds = enrollments?.map((e) => e.id) || [];

    if (enrollmentIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success')
        .in('enrollment_id', enrollmentIds);

      totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    }
  }

  const recentCourses = courses?.slice(0, 5);

  return (
    <div className="p-6 lg:p-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-primary">{totalCourses}</div>
          <div className="text-sm text-muted-foreground">Total Kursus</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-green-600">{publishedCourses}</div>
          <div className="text-sm text-muted-foreground">Dipublikasi</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-blue-600">{totalStudents}</div>
          <div className="text-sm text-muted-foreground">Total Siswa</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-yellow-600">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-sm text-muted-foreground">Pendapatan</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/mentor/courses/create">
          <Button>Buat Kursus Baru</Button>
        </Link>
        <Link href="/mentor/courses">
          <Button variant="outline">Kelola Kursus</Button>
        </Link>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Kursus Terbaru</h2>
        </div>
        {recentCourses && recentCourses.length > 0 ? (
          <div className="divide-y">
            {recentCourses.map((course) => (
              <div key={course.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h3 className="font-medium">{course.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          course.status === 'published'
                            ? 'bg-green-500'
                            : course.status === 'draft'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      {course.status === 'published'
                        ? 'Dipublikasi'
                        : course.status === 'draft'
                        ? 'Draft'
                        : 'Diarsipkan'}
                    </span>
                    <span>{course.total_students} siswa</span>
                    <span>Rp {course.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <Link href={`/mentor/courses/${course.id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Belum ada kursus. Buat kursus pertama Anda!
          </div>
        )}
      </div>
    </div>
  );
}