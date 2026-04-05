import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { generateCertificate } from '@/lib/certificate';

// POST - Mark lesson as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get lesson with module and course info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        module_id,
        modules!inner (
          course_id
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('Lesson error:', lessonError);
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // modules relation returns a single object (not array) when fetching by FK
    const moduleData = lesson.modules as { course_id: string } | { course_id: string }[];
    const courseId = Array.isArray(moduleData) ? moduleData[0]?.course_id : moduleData?.course_id;

    if (!courseId) {
      console.error('No course_id found for lesson:', lessonId, 'moduleData:', moduleData);
      return NextResponse.json(
        { success: false, error: 'Course not found for this lesson' },
        { status: 404 }
      );
    }

    // Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollmentError) {
      console.error('Enrollment query error:', enrollmentError);
    }

    if (!enrollment) {
      console.error('No enrollment found - userId:', user.id, 'courseId:', courseId);
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Mark lesson as complete
    await supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

    // Calculate new progress percentage
    const { data: allModules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    const moduleIds = allModules?.map((m) => m.id) || [];

    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .in('module_id', moduleIds);

    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_id', enrollment.id)
      .eq('is_completed', true);

    const progressPercent = totalLessons ? Math.round(((completedCount || 0) / totalLessons) * 100) : 0;

    // Update enrollment progress
    const updateData: Record<string, unknown> = {
      progress_percent: progressPercent,
    };

    let courseCompleted = false;

    // If course completed, trigger certificate generation
    if (progressPercent === 100) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      courseCompleted = true;
    }

    await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollment.id);

    // Generate certificate if course completed
    if (courseCompleted) {
      // Get course and student info
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

      await generateCertificate({
        enrollmentId: enrollment.id,
        studentId: user.id,
        courseId: courseId,
        courseName: course?.title || 'Course',
        studentName: user.name || 'Student',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        courseProgress: progressPercent,
        courseCompleted,
      },
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}