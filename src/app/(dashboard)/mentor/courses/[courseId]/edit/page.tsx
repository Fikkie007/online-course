import { getCurrentUser, isMentor } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { CourseEditForm, ModuleManager } from '@/components/course';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MentorCourseEditPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function MentorCourseEditPage({ params }: MentorCourseEditPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const canManage = await isMentor();
  if (!canManage) {
    redirect('/student');
  }

  const { courseId } = await params;
  const supabase = createAdminClient();

  // Verify course exists and user is owner
  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, mentor_id')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Only owner can edit
  if (course.mentor_id !== user.id) {
    redirect('/mentor/courses');
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/mentor/courses">
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Button>
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold">Edit Kursus</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Course Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Pengaturan Kursus</h2>
          <CourseEditForm courseId={courseId} redirectAfterSave="/mentor/courses" />
        </div>

        {/* Module & Lesson Management */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Modul & Materi</h2>
          <ModuleManager courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
