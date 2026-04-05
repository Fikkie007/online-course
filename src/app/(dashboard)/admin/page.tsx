import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdm = await isAdmin();
  if (!isAdm) {
    redirect('/student');
  }

  const supabase = createAdminClient();

  // Get stats
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });

  const { count: publishedCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: totalEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true });

  // Get recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select(`
      *,
      student:profiles!payments_student_id_fkey(full_name, email)
    `)
    .eq('status', 'success')
    .order('paid_at', { ascending: false })
    .limit(5);

  // Get total revenue
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'success');

  const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-blue-600">{totalUsers || 0}</div>
          <div className="text-sm text-muted-foreground">Total User</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-green-600">{publishedCourses || 0}</div>
          <div className="text-sm text-muted-foreground">Kursus Dipublikasi</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-purple-600">{totalEnrollments || 0}</div>
          <div className="text-sm text-muted-foreground">Total Pendaftaran</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-yellow-600">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/admin/users"
          className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="font-semibold mb-1">Kelola User</div>
          <p className="text-sm text-muted-foreground">Lihat dan kelola semua user</p>
        </Link>
        <Link
          href="/admin/courses"
          className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="font-semibold mb-1">Kelola Kursus</div>
          <p className="text-sm text-muted-foreground">Moderasi dan kelola kursus</p>
        </Link>
        <Link
          href="/admin/payments"
          className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="font-semibold mb-1">Transaksi</div>
          <p className="text-sm text-muted-foreground">Lihat semua transaksi</p>
        </Link>
        <Link
          href="/admin/notifications"
          className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="font-semibold mb-1">Notifikasi</div>
          <p className="text-sm text-muted-foreground">Kirim notifikasi manual</p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
        </div>
        {recentPayments && recentPayments.length > 0 ? (
          <div className="divide-y">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium">{payment.student?.full_name || 'User'}</div>
                  <div className="text-sm text-muted-foreground">{payment.student?.email}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    Rp {payment.amount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Belum ada transaksi
          </div>
        )}
      </div>
    </div>
  );
}