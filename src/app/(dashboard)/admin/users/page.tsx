import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminUsersPageProps {
  searchParams: Promise<{ role?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdm = await isAdmin();
  if (!isAdm) {
    redirect('/student');
  }

  const params = await searchParams;
  const roleFilter = params.role;
  const page = parseInt(params.page || '1');
  const pageSize = 20;

  const supabase = createAdminClient();

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (roleFilter) {
    query = query.eq('role', roleFilter);
  }

  const { data: users, count } = await query;

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Kelola User</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Link href="/admin/users">
            <Button variant={!roleFilter ? 'default' : 'outline'} size="sm">
              Semua
            </Button>
          </Link>
          <Link href="/admin/users?role=admin">
            <Button variant={roleFilter === 'admin' ? 'default' : 'outline'} size="sm">
              Admin
            </Button>
          </Link>
          <Link href="/admin/users?role=mentor">
            <Button variant={roleFilter === 'mentor' ? 'default' : 'outline'} size="sm">
              Mentor
            </Button>
          </Link>
          <Link href="/admin/users?role=student">
            <Button variant={roleFilter === 'student' ? 'default' : 'outline'} size="sm">
              Student
            </Button>
          </Link>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="font-medium">{u.full_name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'mentor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={`/api/admin/users/${u.id}/role`} method="POST" className="inline">
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="student">Student</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button type="submit" variant="outline" size="sm" className="ml-2">
                        Update
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/users?page=${p}${roleFilter ? `&role=${roleFilter}` : ''}`}
              >
                <Button variant={p === page ? 'default' : 'outline'} size="sm">
                  {p}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}