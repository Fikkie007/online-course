import { getCurrentUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminCourseForm } from '@/components/course/AdminCourseForm';

export default async function AdminCreateCoursePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdm = await isAdmin();
  if (!isAdm) {
    redirect('/student');
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Buat Kursus Baru</h1>

      <div className="max-w-3xl">
        <AdminCourseForm />
      </div>
    </div>
  );
}