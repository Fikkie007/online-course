import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

// POST - Initiate enrollment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Check course exists and is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, status')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Course not available for enrollment' },
        { status: 400 }
      );
    }

    // Check existing enrollment
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already enrolled',
          enrollment: existingEnrollment,
        },
        { status: 400 }
      );
    }

    // Create enrollment with pending status
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId,
        status: course.price === 0 ? 'active' : 'pending',
        enrolled_at: course.price === 0 ? new Date().toISOString() : null,
        expires_at: course.price === 0
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select()
      .single();

    if (enrollmentError) {
      return NextResponse.json(
        { success: false, error: enrollmentError.message },
        { status: 500 }
      );
    }

    // If free course, directly activate
    if (course.price === 0) {
      return NextResponse.json({
        success: true,
        data: enrollment,
        requiresPayment: false,
      });
    }

    // If paid course, create payment record
    const orderId = `COURSE-${courseId}-${user.id}-${Date.now()}`;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        enrollment_id: enrollment.id,
        student_id: user.id,
        amount: course.price,
        currency: 'IDR',
        status: 'pending',
        midtrans_order_id: orderId,
      })
      .select()
      .single();

    if (paymentError) {
      return NextResponse.json(
        { success: false, error: paymentError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enrollment,
        payment,
        course,
      },
      requiresPayment: true,
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}