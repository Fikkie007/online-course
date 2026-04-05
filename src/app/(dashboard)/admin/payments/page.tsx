import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminPaymentsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
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
  const page = parseInt(params.page || '1');
  const pageSize = 20;

  const supabase = createAdminClient();

  // Get payments with student and course info
  let query = supabase
    .from('payments')
    .select(`
      *,
      student:profiles!payments_student_id_fkey(id, full_name, email),
      enrollment:enrollments(
        course:courses(title, slug)
      )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: payments, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Get stats
  const { count: totalPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true });

  const { count: successPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'success');

  const { count: pendingPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: failedPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  // Get total revenue
  const { data: successPaymentsData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'success');

  const totalRevenue = successPaymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const totalPages = Math.ceil((count || 0) / pageSize);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Transaksi Pembayaran</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-blue-600">{totalPayments || 0}</div>
          <div className="text-sm text-muted-foreground">Total Transaksi</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-green-600">{successPayments || 0}</div>
          <div className="text-sm text-muted-foreground">Berhasil</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-yellow-600">{pendingPayments || 0}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-red-600">{failedPayments || 0}</div>
          <div className="text-sm text-muted-foreground">Gagal</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Link href="/admin/payments">
          <Button variant={!statusFilter ? 'default' : 'outline'} size="sm">
            Semua
          </Button>
        </Link>
        <Link href="/admin/payments?status=success">
          <Button variant={statusFilter === 'success' ? 'default' : 'outline'} size="sm">
            Berhasil
          </Button>
        </Link>
        <Link href="/admin/payments?status=pending">
          <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm">
            Pending
          </Button>
        </Link>
        <Link href="/admin/payments?status=failed">
          <Button variant={statusFilter === 'failed' ? 'default' : 'outline'} size="sm">
            Gagal
          </Button>
        </Link>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Siswa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Kursus</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Jumlah</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">
                        {payment.midtrans_order_id || payment.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{payment.student?.full_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{payment.student?.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <div className="font-medium truncate">
                          {payment.enrollment?.course?.title || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : payment.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.status === 'success'
                          ? 'Berhasil'
                          : payment.status === 'pending'
                          ? 'Pending'
                          : payment.status === 'failed'
                          ? 'Gagal'
                          : payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div>{formatDate(payment.created_at)}</div>
                        {payment.paid_at && (
                          <div className="text-xs text-green-600">
                            Dibayar: {formatDate(payment.paid_at)}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Tidak ada transaksi ditemukan.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/payments?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>
              <Button variant="outline" size="sm">Sebelumnya</Button>
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Link href={`/admin/payments?page=${p}${statusFilter ? `&status=${statusFilter}` : ''}`}>
                  <Button variant={p === page ? 'default' : 'outline'} size="sm">
                    {p}
                  </Button>
                </Link>
              </span>
            ))}

          {page < totalPages && (
            <Link href={`/admin/payments?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>
              <Button variant="outline" size="sm">Selanjutnya</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}