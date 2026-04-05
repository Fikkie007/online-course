import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  console.log('[Send Email] Starting...');
  console.log('[Send Email] To:', to);
  console.log('[Send Email] Subject:', subject);

  try {
    const resend = getResendClient();

    // Use custom from or default from env
    const senderEmail = from || process.env.EMAIL_FROM || 'onboarding@resend.dev';
    console.log('[Send Email] From:', senderEmail);

    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Send Email] Resend API error:', error);
      return { success: false, error };
    }

    console.log('[Send Email] Success! Email ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('[Send Email] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}