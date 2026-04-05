import { NextRequest, NextResponse } from 'next/server';
import { checkTransactionStatus } from '@/lib/midtrans';
import { getCurrentUser } from '@/lib/auth';

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