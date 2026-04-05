import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { checkTransactionStatus } from '@/lib/midtrans';
import { sendEnrollmentNotification } from '@/lib/queue';

// POST - Manually sync payment status from Midtrans
// Use this when webhooks can't reach localhost during development
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get payment by order_id
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, enrollment:enrollments(id, student_id, course_id)')
      .eq('midtrans_order_id', order_id)
      .eq('student_id', user.id) // Ensure user owns this payment
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // If already successful, return current status
    if (payment.status === 'success') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'success',
          message: 'Payment already confirmed',
          enrollment_id: payment.enrollment?.id,
        },
      });
    }

    // Check status from Midtrans
    let midtransStatus;
    try {
      midtransStatus = await checkTransactionStatus(order_id);
    } catch (error) {
      console.error('Failed to check Midtrans status:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify payment with Midtrans',
      }, { status: 500 });
    }

    const transactionStatus = midtransStatus.transaction_status;
    const paymentType = midtransStatus.payment_type;

    // Determine payment status
    let paymentStatus: string;
    let enrollmentStatus: string | null = null;

    if (
      transactionStatus === 'settlement' ||
      transactionStatus === 'capture'
    ) {
      paymentStatus = 'success';
      enrollmentStatus = 'active';
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel'
    ) {
      paymentStatus = 'failed';
    } else if (transactionStatus === 'expire') {
      paymentStatus = 'expired';
    } else if (transactionStatus === 'refund') {
      paymentStatus = 'refunded';
    } else {
      paymentStatus = 'pending';
    }

    // Update payment
    const updateData: Record<string, unknown> = {
      status: paymentStatus,
      payment_method: paymentType,
    };

    if (paymentStatus === 'success') {
      updateData.paid_at = new Date().toISOString();
    }

    await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id);

    // Update enrollment if payment successful
    if (enrollmentStatus === 'active' && payment.enrollment) {
      await supabase
        .from('enrollments')
        .update({
          status: 'active',
          enrolled_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('id', payment.enrollment.id);

      // Update course total_students
      try {
        await supabase.rpc('increment_total_students', {
          course_id: payment.enrollment.course_id,
        });
      } catch (rpcError) {
        console.error('Failed to increment total_students:', rpcError);
        // Continue even if this fails
      }

      // Get course info for notification
      const { data: course } = await supabase
        .from('courses')
        .select('title, price')
        .eq('id', payment.enrollment.course_id)
        .single();

      // Trigger notification
      if (course) {
        try {
          await sendEnrollmentNotification(
            payment.enrollment.student_id,
            course.title,
            course.price
          );
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Continue even if notification fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: paymentStatus,
        transaction_status: transactionStatus,
        payment_type: paymentType,
        enrollment_id: payment.enrollment?.id,
        is_enrolled: enrollmentStatus === 'active',
      },
    });
  } catch (error) {
    console.error('Sync payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}