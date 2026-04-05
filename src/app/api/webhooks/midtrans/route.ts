import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySignature } from '@/lib/midtrans';
import { sendEnrollmentNotification } from '@/lib/queue';

// POST - Midtrans webhook notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      transaction_id,
    } = body;

    // Verify signature
    const isValid = verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) {
      console.error('Invalid Midtrans signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get payment by order_id
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, enrollment:enrollments(id, student_id, course_id)')
      .eq('midtrans_order_id', order_id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', order_id);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Handle different transaction statuses
    let paymentStatus: string;
    let enrollmentStatus: string | null = null;

    if (
      transaction_status === 'settlement' ||
      transaction_status === 'capture'
    ) {
      paymentStatus = 'success';
      enrollmentStatus = 'active';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel'
    ) {
      paymentStatus = 'failed';
    } else if (transaction_status === 'expire') {
      paymentStatus = 'expired';
    } else if (transaction_status === 'refund') {
      paymentStatus = 'refunded';
    } else {
      paymentStatus = 'pending';
    }

    // Update payment - SECURITY: Use idempotent update with status check
    const updateData: Record<string, unknown> = {
      status: paymentStatus,
      payment_method: payment_type,
    };

    if (paymentStatus === 'success') {
      updateData.paid_at = new Date().toISOString();
    }

    // IDEMPOTENCY: Only update if current status is 'pending'
    // This prevents duplicate webhook processing
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', payment.id)
      .eq('status', 'pending') // Critical: Only update pending payments
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      // Still return success to prevent webhook retries for non-recoverable errors
      return NextResponse.json({ success: true, note: 'Update failed but acknowledged' });
    }

    // If no rows updated, payment was already processed (idempotency check)
    if (!updatedPayment) {
      console.log('[Midtrans Webhook] Payment already processed:', order_id);
      return NextResponse.json({ success: true, note: 'Already processed' });
    }

    // Update enrollment if payment successful
    if (enrollmentStatus === 'active' && payment.enrollment) {
      await supabase
        .from('enrollments')
        .update({
          status: 'active',
          enrolled_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(), // 1 year
        })
        .eq('id', payment.enrollment.id);

      // Update course total_students
      await supabase.rpc('increment_total_students', {
        course_id: payment.enrollment.course_id,
      });

      // Get course info for notification
      const { data: course } = await supabase
        .from('courses')
        .select('title, price')
        .eq('id', payment.enrollment.course_id)
        .single();

      // Trigger notification (email + WhatsApp)
      if (course) {
        await sendEnrollmentNotification(
          payment.enrollment.student_id,
          course.title,
          course.price
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}