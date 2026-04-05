import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { Course, Module, Lesson, Profile } from '@/types';
import { CurriculumAccordion } from '@/components/course';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const user = await getCurrentUser();

  // Get course by slug
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      mentor:profiles!courses_mentor_id_fkey(id, full_name, avatar_url, email),
      categories:course_categories(
        category:categories(id, name, slug, icon)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !course) {
    notFound();
  }

  // Transform categories from junction table
  const courseCategories = course.categories?.map((cc: any) => cc.category) || [];

  // Check enrollment status
  let enrollment = null;
  if (user) {
    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .single();
    enrollment = enrollmentData;
  }

  // Get modules with lessons
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      *,
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
    .eq('course_id', course.id)
    .order('order_index');

  // Calculate total lessons
  const totalLessons = modules?.reduce(
    (sum: number, m) => sum + (m.lessons?.length || 0),
    0
  ) || 0;

  const isEnrolled = enrollment?.status === 'active' || enrollment?.status === 'completed';
  const hasDiscount = course.discount_price && course.discount_price < course.price;
  const displayPrice = hasDiscount ? course.discount_price : course.price;
  const isFree = displayPrice === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left - Course Info */}
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{course.title}</h1>

              {course.description && (
                <p className="text-lg opacity-90 mb-6">{course.description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {course.total_students} siswa terdaftar
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.duration_hours ? `${course.duration_hours} jam total durasi` : `${totalLessons} pelajaran`}
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {totalLessons} pelajaran
                </div>

                {course.rating && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {course.rating.toFixed(1)} rating
                  </div>
                )}
              </div>

              {/* Categories */}
              {courseCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {courseCategories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/courses?category=${cat.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
                    >
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Mentor */}
              <div className="mt-6 flex items-center gap-3">
                {course.mentor?.avatar_url ? (
                  <img
                    src={course.mentor.avatar_url}
                    alt={course.mentor.full_name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    {course.mentor?.full_name?.charAt(0) || 'M'}
                  </div>
                )}
                <div>
                  <p className="font-medium">{course.mentor?.full_name || 'Mentor'}</p>
                  <p className="text-sm opacity-70">Instruktur</p>
                </div>
              </div>
            </div>

            {/* Right - Price Card */}
            <div className="lg:w-80">
              <div className="bg-white rounded-lg shadow-lg p-6 text-gray-900">
                {/* Price */}
                <div className="mb-4">
                  {isFree ? (
                    <span className="text-3xl font-bold text-green-600">Gratis</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        Rp {displayPrice?.toLocaleString('id-ID')}
                      </span>
                      {hasDiscount && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-muted-foreground line-through">
                            Rp {course.price.toLocaleString('id-ID')}
                          </span>
                          <span className="text-red-500 font-medium">
                            {Math.round((1 - course.discount_price! / course.price) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action Button */}
                {isEnrolled ? (
                  <Link href={`/student/courses/${enrollment?.id}/learn`}>
                    <Button className="w-full" size="lg">
                      Lanjut Belajar
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/student/checkout/${course.id}`}>
                    <Button className="w-full" size="lg">
                      {isFree ? 'Mulai Belajar' : 'Beli Kursus'}
                    </Button>
                  </Link>
                )}

                {/* Features */}
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Akses selamanya
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sertifikat digital
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Materi video berkualitas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-4 border-b mb-8">
          <button className="px-4 py-2 border-b-2 border-primary font-medium">
            Kurikulum
          </button>
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
            Instruktur
          </button>
          <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
            Ulasan
          </button>
        </div>

        {/* Curriculum */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Kurikulum Kursus</h2>
          {modules && modules.length > 0 ? (
            <CurriculumAccordion
              modules={modules as (Module & { lessons: Lesson[] })[]}
              isEnrolled={isEnrolled}
            />
          ) : (
            <p className="text-muted-foreground">Kurikulum belum tersedia</p>
          )}
        </div>
      </div>
    </div>
  );
}