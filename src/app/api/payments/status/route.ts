import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { checkTransactionStatus } from '@/lib/midtrans';

// GET - Check payment status by order_id
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // SECURITY: Verify the payment belongs to the requesting user
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, student_id, status')
      .eq('midtrans_order_id', orderId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // SECURITY: Prevent IDOR - user can only check their own payments
    if (payment.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = await checkTransactionStatus(orderId);

    return NextResponse.json({
      success: true,
      data: {
        order_id: status.order_id,
        transaction_status: status.transaction_status,
        payment_type: status.payment_type,
        gross_amount: status.gross_amount,
        transaction_time: status.transaction_time,
        expiry_time: status.expiry_time,
      },
    });
  } catch (error) {
    console.error('Check transaction status error:', error);
    return NextResponse.json(
      { error: 'Failed to check transaction status' },
      { status: 500 }
    );
  }
}