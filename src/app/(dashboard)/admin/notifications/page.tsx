import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import SendNotificationForm from './SendNotificationForm';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdm = await isAdmin();
  if (!isAdm) {
    redirect('/student');
  }

  const supabase = createAdminClient();

  // Get recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      user:profiles!notifications_user_id_fkey(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Get stats
  const { count: totalNotifications } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  // Get users for sending notifications
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('full_name')
    .limit(100);

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
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Notifikasi</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-blue-600">{totalNotifications || 0}</div>
          <div className="text-sm text-muted-foreground">Total Notifikasi</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-orange-600">{unreadNotifications || 0}</div>
          <div className="text-sm text-muted-foreground">Belum Dibaca</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="text-2xl font-bold text-green-600">{users?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total User</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Send Notification Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Kirim Notifikasi</h2>
            <SendNotificationForm users={users || []} />
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Riwayat Notifikasi</h2>
            </div>

            {notifications && notifications.length > 0 ? (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          )}
                          <h3 className="font-medium">{notification.title}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              notification.type === 'email'
                                ? 'bg-purple-100 text-purple-700'
                                : notification.type === 'whatsapp'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {notification.user && (
                            <span>
                              Ke: {notification.user.full_name || notification.user.email}
                            </span>
                          )}
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                      <div>
                        {notification.is_read ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Dibaca
                          </span>
                        ) : (
                          <span className="text-xs text-orange-600">Belum dibaca</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Belum ada notifikasi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}