import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  HelpCircle,
  CheckCircle,
  Lock,
  Download,
  ExternalLink,
  Image,
} from 'lucide-react';
import { CompleteLessonButton } from '@/components/course';

interface LearnPageProps {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ lesson?: string }>;
}

// Helper to determine file type from URL
function getFileType(url: string): 'pdf' | 'image' | 'office' | 'video' | 'other' {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.match(/\.(pdf)(\?|$)/)) return 'pdf';
  if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) return 'image';
  if (lowerUrl.match(/\.(doc|docx|xls|xlsx|ppt|pptx)(\?|$)/)) return 'office';
  if (lowerUrl.match(/\.(mp4|webm|ogg|mov)(\?|$)/)) return 'video';

  // Check mime type from URL patterns (for cloud storage)
  if (lowerUrl.includes('application/pdf')) return 'pdf';
  if (lowerUrl.includes('image/')) return 'image';
  if (lowerUrl.includes('video/')) return 'video';
  if (lowerUrl.includes('spreadsheet') || lowerUrl.includes('document') || lowerUrl.includes('presentation')) return 'office';

  return 'other';
}

// Helper to get Google Docs Viewer URL
function getGoogleViewerUrl(url: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
  const { enrollmentId } = await params;
  const { lesson: lessonId } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createAdminClient();

  // Get enrollment with course info
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses (
        id,
        title,
        slug
      )
    `)
    .eq('id', enrollmentId)
    .eq('student_id', user.id)
    .single();

  if (enrollmentError || !enrollment) {
    notFound();
  }

  if (enrollment.status !== 'active' && enrollment.status !== 'completed') {
    redirect('/student/courses');
  }

  // Get modules with lessons
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      order_index,
      lessons (
        id,
        title,
        content_type,
        content_url,
        duration_minutes,
        order_index,
        is_preview
      )
    `)
    .eq('course_id', enrollment.course_id)
    .order('order_index');

  // Get completed lessons
  const { data: completedLessons } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('enrollment_id', enrollmentId)
    .eq('is_completed', true);

  const completedLessonIds = completedLessons?.map((l) => l.lesson_id) || [];

  // Flatten all lessons for navigation
  const allLessons =
    modules?.flatMap((m) =>
      (m.lessons || []).map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title }))
    ) || [];

  // Find current lesson
  let currentLesson = allLessons[0];
  let currentIndex = 0;

  if (lessonId) {
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx !== -1) {
      currentLesson = allLessons[idx];
      currentIndex = idx;
    }
  }

  // Previous and next lessons
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = completedLessonIds.includes(currentLesson?.id);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  // Render content based on type
  const renderContent = () => {
    if (!currentLesson?.content_url) {
      return (
        <div className="text-white text-center">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Konten tidak tersedia</p>
        </div>
      );
    }

    // Video content
    if (currentLesson.content_type === 'video') {
      const isYouTube = currentLesson.content_url.includes('youtube.com') ||
                        currentLesson.content_url.includes('youtu.be');
      const isVimeo = currentLesson.content_url.includes('vimeo.com');

      if (isYouTube) {
        const videoId = currentLesson.content_url.includes('youtu.be')
          ? currentLesson.content_url.split('/').pop()
          : new URL(currentLesson.content_url).searchParams.get('v');
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        );
      }

      if (isVimeo) {
        const videoId = currentLesson.content_url.split('/').pop();
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            className="w-full h-full"
            allowFullScreen
          />
        );
      }

      return (
        <video
          src={currentLesson.content_url}
          controls
          className="w-full h-full"
          controlsList="nodownload"
        />
      );
    }

    // Document content
    if (currentLesson.content_type === 'document') {
      const fileType = getFileType(currentLesson.content_url);
      const fileName = currentLesson.content_url.split('/').pop()?.split('?')[0] || 'Dokumen';

      // PDF - render inline with iframe
      if (fileType === 'pdf') {
        return (
          <iframe
            src={currentLesson.content_url}
            className="w-full h-full bg-white"
            title={currentLesson.title}
          />
        );
      }

      // Image - render directly
      if (fileType === 'image') {
        return (
          <div className="w-full h-full overflow-auto bg-gray-900 flex items-start justify-center p-4">
            <img
              src={currentLesson.content_url}
              alt={currentLesson.title}
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        );
      }

      // Office documents - use Google Docs Viewer
      if (fileType === 'office') {
        return (
          <iframe
            src={getGoogleViewerUrl(currentLesson.content_url)}
            className="w-full h-full bg-white"
            title={currentLesson.title}
          />
        );
      }

      // Other document types - show download option with preview attempt
      return (
        <div className="w-full h-full bg-gray-800 flex flex-col">
          {/* Try to render in iframe */}
          <div className="flex-1 relative">
            <iframe
              src={currentLesson.content_url}
              className="w-full h-full bg-white"
              title={currentLesson.title}
            />
          </div>
          {/* Fallback toolbar */}
          <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
            <span className="text-gray-300 text-sm truncate">{fileName}</span>
            <div className="flex gap-2">
              <a
                href={currentLesson.content_url}
                download
                className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <a
                href={currentLesson.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Buka
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Quiz content - placeholder for future implementation
    if (currentLesson.content_type === 'quiz') {
      return (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white max-w-md p-8">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <p className="text-xl font-semibold mb-2">Quiz</p>
            <p className="text-gray-400 mb-4">
              Fitur quiz akan segera hadir. Sementara ini, Anda bisa mengakses quiz melalui link di bawah.
            </p>
            {currentLesson.content_url && (
              <a
                href={currentLesson.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Buka Quiz
              </a>
            )}
          </div>
        </div>
      );
    }

    // Unknown content type
    return (
      <div className="text-white text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Konten tidak didukung</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar - Course content */}
      <div className="w-80 bg-gray-800 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <Link
            href="/student/courses"
            className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Kursus Saya
          </Link>
          <h2 className="text-white font-semibold mt-2 line-clamp-2">
            {enrollment.course?.title}
          </h2>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Progress</span>
              <span>{enrollment.progress_percent}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 rounded-full h-2"
                style={{ width: `${enrollment.progress_percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Modules and Lessons */}
        <div className="p-2">
          {modules?.map((module) => (
            <div key={module.id} className="mb-2">
              <div className="text-gray-400 text-sm font-medium px-2 py-2">
                {module.title}
              </div>
              {module.lessons?.map((lesson) => {
                const isLessonCompleted = completedLessonIds.includes(lesson.id);
                const isCurrent = currentLesson?.id === lesson.id;

                return (
                  <Link
                    key={lesson.id}
                    href={`/student/courses/${enrollmentId}/learn?lesson=${lesson.id}`}
                    className={`flex items-center gap-2 px-2 py-2 rounded text-sm ${
                      isCurrent
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {isLessonCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        getContentTypeIcon(lesson.content_type)
                      )}
                    </span>
                    <span className="line-clamp-1">{lesson.title}</span>
                    {lesson.duration_minutes && (
                      <span className="text-gray-500 text-xs ml-auto">
                        {lesson.duration_minutes} menit
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Video/Content area */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          {renderContent()}
        </div>

        {/* Lesson info and navigation */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-white font-semibold text-lg">
                {currentLesson?.title}
              </h1>
              <p className="text-gray-400 text-sm">
                {currentLesson?.moduleTitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {prevLesson && (
                <Link
                  href={`/student/courses/${enrollmentId}/learn?lesson=${prevLesson.id}`}
                >
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Sebelumnya
                  </Button>
                </Link>
              )}

              {/* Mark complete button */}
              <CompleteLessonButton
                lessonId={currentLesson?.id}
                isCompleted={isCompleted}
              />

              {nextLesson && (
                <Link
                  href={`/student/courses/${enrollmentId}/learn?lesson=${nextLesson.id}`}
                >
                  <Button size="sm">
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}