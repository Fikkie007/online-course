import { getCurrentUser, isMentor } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CourseForm } from '@/components/course/CourseForm';

export default async function CreateCoursePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const canAccess = await isMentor();
  if (!canAccess) {
    redirect('/student');
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Buat Kursus Baru</h1>

      <div className="max-w-3xl">
        <CourseForm />
      </div>
    </div>
  );
}