import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createAdminClient();

  // Get student stats
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(
        id,
        title,
        slug,
        thumbnail_url,
        duration_hours,
        mentor:profiles!courses_mentor_id_fkey(full_name)
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  const activeCourses = enrollments?.filter((e) => e.status === 'active') || [];
  const completedCourses = enrollments?.filter((e) => e.status === 'completed') || [];
  const totalProgress = enrollments?.reduce((sum, e) => sum + (e.progress_percent || 0), 0) || 0;
  const avgProgress = enrollments?.length ? Math.round(totalProgress / enrollments.length) : 0;

  // Get recent courses
  const recentCourses = activeCourses.slice(0, 3);

  // Get certificates count
  const { count: certificatesCount } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Get recommended courses (courses not enrolled)
  const { data: recommendedCourses } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      price,
      discount_price,
      total_students,
      rating
    `)
    .eq('status', 'published')
    .order('total_students', { ascending: false })
    .limit(4);

  // Filter out enrolled courses
  const enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];
  const filteredRecommended = recommendedCourses?.filter(
    (c) => !enrolledCourseIds.includes(c.id)
  ).slice(0, 3);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Selamat datang, {user.name || 'Student'}!
        </h1>
        <p className="text-muted-foreground">
          {recentCourses.length > 0
            ? 'Lanjutkan perjalanan belajar Anda'
            : 'Mulai jelajahi kursus untuk meningkatkan skill Anda'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Active Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-primary">{activeCourses.length}</div>
          <div className="text-sm text-muted-foreground">Kursus Aktif</div>
        </div>

        {/* Completed Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">{completedCourses.length}</div>
          <div className="text-sm text-muted-foreground">Kursus Selesai</div>
        </div>

        {/* Certificates */}
        <Link href="/student/certificates" className="block">
          <div className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{certificatesCount || 0}</div>
            <div className="text-sm text-muted-foreground">Sertifikat</div>
          </div>
        </Link>

        {/* Average Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{avgProgress}%</div>
          <div className="text-sm text-muted-foreground">Rata-rata Progress</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/courses">
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Jelajahi Kursus
          </Button>
        </Link>
        <Link href="/student/courses">
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Semua Kursus
          </Button>
        </Link>
      </div>

      {/* Continue Learning Section */}
      {recentCourses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Lanjutkan Belajar</h2>
            <Link href="/student/courses" className="text-sm text-primary hover:underline">
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentCourses.map((enrollment: any) => (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border group hover:shadow-md transition-shadow"
              >
                <div className="relative h-32 bg-muted">
                  {enrollment.course?.thumbnail_url ? (
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}

                  {/* Progress overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${enrollment.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {enrollment.course?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {enrollment.course?.mentor?.full_name || 'Mentor'}
                  </p>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{enrollment.progress_percent}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${enrollment.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  <Link href={`/student/courses/${enrollment.id}/learn`}>
                    <Button className="w-full" size="sm">
                      Lanjut Belajar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentCourses.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center border mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Mulai Belajar</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Anda belum memiliki kursus aktif. Jelajahi katalog kami dan temukan kursus yang sesuai dengan minat Anda.
          </p>
          <Link href="/courses">
            <Button size="lg">Jelajahi Kursus</Button>
          </Link>
        </div>
      )}

      {/* Recommended Courses */}
      {filteredRecommended && filteredRecommended.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Rekomendasi Kursus</h2>
            <Link href="/courses" className="text-sm text-primary hover:underline">
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRecommended.map((course) => {
              const isFree = course.price === 0;
              const hasDiscount = course.discount_price && course.discount_price < course.price;
              const displayPrice = hasDiscount ? course.discount_price : course.price;

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border group hover:shadow-md transition-shadow"
                >
                  <div className="relative h-32 bg-muted">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No thumbnail
                      </div>
                    )}

                    {isFree && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Gratis
                      </div>
                    )}
                    {hasDiscount && !isFree && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Diskon
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {isFree ? 'Gratis' : `Rp ${displayPrice?.toLocaleString('id-ID')}`}
                      </span>

                      {course.rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Courses Preview */}
      {completedCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Kursus Selesai</h2>
            <Link href="/student/courses" className="text-sm text-primary hover:underline">
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {completedCourses.slice(0, 3).map((enrollment: any) => (
              <div
                key={enrollment.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-l-4 border-l-green-500 group hover:shadow-md transition-shadow"
              >
                <div className="relative h-24 bg-muted">
                  {enrollment.course?.thumbnail_url ? (
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-1">
                    {enrollment.course?.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selesai
                  </div>
                  <Link href={`/student/courses/${enrollment.id}/learn`}>
                    <Button variant="outline" className="w-full" size="sm">
                      Lihat Kembali
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}