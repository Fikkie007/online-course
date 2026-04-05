import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SidebarNav } from '@/components/student/SidebarNav';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNav user={user} />

      {/* Main content */}
      <div className="lg:ml-64">
        <main>{children}</main>
      </div>
    </div>
  );
}