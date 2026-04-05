import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { createSnapToken } from '@/lib/midtrans';

// POST - Create payment for enrollment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json(
        { success: false, error: 'course_id is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', course_id)
      .single();

    if (existingEnrollment && existingEnrollment.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, status')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Course not available' },
        { status: 400 }
      );
    }

    // For free courses
    if (course.price === 0) {
      // Create or update enrollment
      if (existingEnrollment) {
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .update({
            status: 'active',
            enrolled_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', existingEnrollment.id)
          .select()
          .single();

        if (enrollmentError) {
          return NextResponse.json(
            { success: false, error: enrollmentError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { enrollment, isFree: true },
        });
      }

      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: course_id,
          status: 'active',
          enrolled_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (enrollmentError) {
        return NextResponse.json(
          { success: false, error: enrollmentError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { enrollment, isFree: true },
      });
    }

    // For paid courses
    // Check if there's a pending payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, midtrans_order_id, midtrans_token, status')
      .eq('student_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Return existing pending payment
    if (existingPayment?.midtrans_token) {
      return NextResponse.json({
        success: true,
        data: {
          snap_token: existingPayment.midtrans_token,
          order_id: existingPayment.midtrans_order_id,
          amount: course.price,
        },
      });
    }

    // Create new enrollment if not exists
    let enrollmentId = existingEnrollment?.id;
    if (!enrollmentId) {
      const { data: newEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: course_id,
          status: 'pending',
        })
        .select()
        .single();

      if (enrollmentError) {
        return NextResponse.json(
          { success: false, error: enrollmentError.message },
          { status: 500 }
        );
      }
      enrollmentId = newEnrollment.id;
    }

    // Generate short unique order ID (max 50 chars for Midtrans)
    // Format: PAY-{timestamp-base36}-{random-4chars}
    const timestampBase36 = Date.now().toString(36); // ~8 chars
    const randomSuffix = Math.random().toString(36).substring(2, 6); // 4 chars
    const orderId = `PAY-${timestampBase36}-${randomSuffix}`; // ~18 chars total

    // Create Snap token
    const snapToken = await createSnapToken({
      orderId,
      amount: course.price,
      customerName: user.name || 'Student',
      customerEmail: user.email || '',
      courseName: course.title,
    });

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        enrollment_id: enrollmentId,
        student_id: user.id,
        amount: course.price,
        currency: 'IDR',
        status: 'pending',
        midtrans_order_id: orderId,
        midtrans_token: snapToken.token,
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
        snap_token: snapToken.token,
        order_id: orderId,
        amount: course.price,
        payment,
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}