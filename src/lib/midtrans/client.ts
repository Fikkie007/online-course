// Midtrans-client is a CommonJS module - use require for server-side compatibility
// @ts-nocheck

const MidtransClient = require('midtrans-client');

let snapClient: any = null;

export function getSnapClient() {
  if (!snapClient) {
    // Use explicit MIDTRANS_IS_PRODUCTION env variable
    // Sandbox QRIS cannot be scanned by real banking apps (BCA Mobile, etc.)
    // Set MIDTRANS_IS_PRODUCTION=true for real QRIS payments
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    snapClient = new MidtransClient.Snap({
      isProduction: isProduction,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
    });
  }
  return snapClient;
}

interface CreateSnapTokenParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  courseName: string;
}

export async function createSnapToken(params: CreateSnapTokenParams) {
  const snap = getSnapClient();

  // Ensure amount meets minimum requirements (QRIS min: 1000 IDR)
  const amount = Math.max(params.amount, 1000);

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: amount,
    },
    customer_details: {
      email: params.customerEmail,
      first_name: params.customerName,
    },
    item_details: [
      {
        id: 'course',
        price: amount,
        quantity: 1,
        name: params.courseName.substring(0, 50),
        category: 'Education',
      },
    ],
    // Enable specific payment methods (optional - remove to enable all)
    enabled_payments: [
      'credit_card',
      'bca_va',
      'bni_va',
      'bri_va',
      'mandiri_bill',
      'permata_va',
      'other_qris', // QRIS (all banks)
      'gopay',
      'shopeepay',
    ],
    callbacks: {
      finish: `${process.env.NEXTAUTH_URL}/student/courses`,
      error: `${process.env.NEXTAUTH_URL}/student/checkout/error`,
      pending: `${process.env.NEXTAUTH_URL}/student/checkout/pending`,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    };
  } catch (error) {
    console.error('Midtrans create token error:', error);
    throw error;
  }
}

export async function checkTransactionStatus(orderId: string) {
  const snap = getSnapClient();

  try {
    const status = await snap.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error('Midtrans check status error:', error);
    throw error;
  }
}

export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  receivedSignature: string
): boolean {
  const crypto = require('crypto');
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  // For sandbox, signature verification uses different server key prefix
  const signatureKey = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');

  return signatureKey === receivedSignature;
}

// Get client key for frontend Snap.js
export function getClientKey() {
  return process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
}

// Get Snap.js URL based on environment
export function getSnapScriptUrl() {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}