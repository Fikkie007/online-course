import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PaymentSyncButton } from '@/components/course/PaymentSyncButton';

interface CoursesPageProps {
  searchParams: Promise<{ payment?: string; enrolled?: string; tab?: string; order_id?: string }>;
}

export default async function StudentCoursesPage({ searchParams }: CoursesPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const supabase = createAdminClient();
  const activeTab = params.tab || 'active';

  // Get all enrollments
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

  const activeEnrollments = enrollments?.filter((e) => e.status === 'active') || [];
  const completedEnrollments = enrollments?.filter((e) => e.status === 'completed') || [];
  const pendingEnrollments = enrollments?.filter((e) => e.status === 'pending') || [];

  // Filter by tab
  const displayedEnrollments =
    activeTab === 'completed'
      ? completedEnrollments
      : activeTab === 'pending'
      ? pendingEnrollments
      : activeEnrollments;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Kursus Saya</h1>

      {/* Payment status messages */}
      {params.enrolled === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Selamat! Anda berhasil mendaftar di kursus gratis.
        </div>
      )}

      {params.payment === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pembayaran berhasil! Anda sekarang dapat mengakses kursus.
        </div>
      )}

      {params.payment === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-yellow-800 font-medium mb-1">Menunggu Konfirmasi Pembayaran</p>
              <p className="text-yellow-700 text-sm mb-3">
                Sudah membayar di simulator? Klik tombol di bawah untuk verifikasi manual.
              </p>
              {params.order_id ? (
                <PaymentSyncButton orderId={params.order_id} />
              ) : (
                <p className="text-yellow-600 text-sm">Order ID tidak ditemukan. Coba buat pembayaran baru.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {params.payment === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Terjadi kesalahan dalam pembayaran. Silakan coba lagi.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link href="/student/courses?tab=active">
          <Button
            variant={activeTab === 'active' ? 'default' : 'outline'}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Sedang Berjalan ({activeEnrollments.length})
          </Button>
        </Link>
        <Link href="/student/courses?tab=completed">
          <Button
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Selesai ({completedEnrollments.length})
          </Button>
        </Link>
        {pendingEnrollments.length > 0 && (
          <Link href="/student/courses?tab=pending">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              className="gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Menunggu Pembayaran ({pendingEnrollments.length})
            </Button>
          </Link>
        )}
      </div>

      {/* Course Grid */}
      {displayedEnrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEnrollments.map((enrollment: any) => {
            const isCompleted = enrollment.status === 'completed';
            const isPending = enrollment.status === 'pending';

            return (
              <div
                key={enrollment.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border group hover:shadow-md transition-shadow ${
                  isCompleted ? 'border-l-4 border-l-green-500' : ''
                } ${isPending ? 'border-l-4 border-l-yellow-500' : ''}`}
              >
                <div className="relative h-32 bg-muted">
                  {enrollment.course?.thumbnail_url ? (
                    <Image
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}

                  {/* Status badge */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Selesai
                    </div>
                  )}
                  {isPending && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Pending
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {enrollment.course?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {enrollment.course?.mentor?.full_name || 'Mentor'}
                  </p>

                  {/* Progress bar */}
                  {!isPending && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progress_percent}%</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div
                          className={`rounded-full h-2 transition-all ${
                            isCompleted ? 'bg-green-500' : 'bg-primary'
                          }`}
                          style={{ width: `${enrollment.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isPending ? (
                    <Link href={`/student/checkout/${enrollment.course?.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        Lanjutkan Pembayaran
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/student/courses/${enrollment.id}/learn`}>
                      <Button
                        className="w-full"
                        size="sm"
                        variant={isCompleted ? 'outline' : 'default'}
                      >
                        {isCompleted ? 'Lihat Kembali' : 'Lanjut Belajar'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center border">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {activeTab === 'completed'
              ? 'Belum ada kursus selesai'
              : activeTab === 'pending'
              ? 'Tidak ada pembayaran pending'
              : 'Tidak ada kursus aktif'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === 'active' && 'Jelajahi kursus dan mulai belajar hari ini.'}
            {activeTab === 'completed' && 'Selesaikan kursus untuk mendapatkan sertifikat.'}
            {activeTab === 'pending' && 'Semua pembayaran sudah diproses.'}
          </p>
          {activeTab === 'active' && (
            <Link href="/courses">
              <Button>Jelajahi Kursus</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}