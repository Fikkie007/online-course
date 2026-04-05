const FONNTE_BASE_URL = 'https://api.fonnte.com';

interface SendMessageParams {
  target: string; // Phone number in international format (628xxx)
  message: string;
}

interface SendMessageResponse {
  status: boolean;
  reason: string;
  data?: {
    id: string;
    phone: string;
    status: string;
  };
}

export async function sendWhatsApp({ target, message }: SendMessageParams): Promise<SendMessageResponse> {
  const apiKey = process.env.FONNTE_API_KEY;

  if (!apiKey) {
    console.warn('FONNTE_API_KEY not set, skipping WhatsApp message');
    return { status: false, reason: 'API key not configured' };
  }

  try {
    const response = await fetch(FONNTE_BASE_URL + '/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        target,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Fonnte error:', data);
      return { status: false, reason: data.message || 'Failed to send message' };
    }

    return {
      status: true,
      reason: 'Success',
      data: data.data,
    };
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    return { status: false, reason: 'Internal error' };
  }
}

// Format phone number to international format
export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, replace with 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  // If doesn't start with 62, add it
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}