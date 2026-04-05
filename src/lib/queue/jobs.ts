import { getNotificationQueue, getEmailQueue, getWhatsAppQueue, NotificationJobData, EmailJobData, WhatsAppJobData } from './queues';
import { createClient } from '@/lib/supabase/server';
import {
  sendEmail,
  welcomeEmailTemplate,
  enrollmentSuccessEmailTemplate,
  courseCompletionEmailTemplate,
  paymentFailedEmailTemplate,
} from '@/lib/resend';
import { sendWhatsApp, formatPhoneNumber, enrollmentSuccessWA, courseCompletionWA, paymentReminderWA } from '@/lib/fonnte';

// Add notification job to queue
export async function addNotificationJob(data: NotificationJobData) {
  const queue = getNotificationQueue();
  if (!queue) {
    // Process directly if no Redis
    await processNotificationDirectly(data);
    return;
  }

  await queue.add('notification', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

// Process notification directly (fallback when no Redis)
async function processNotificationDirectly(data: NotificationJobData) {
  try {
    // Get user info
    const supabase = await createClient();
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.userId)
      .single();

    if (!user) {
      console.error('User not found:', data.userId);
      return;
    }

    // Send based on channel
    if (data.channel === 'email' || data.channel === 'both') {
      await sendEmailNotification(user, data);
    }

    if (data.channel === 'whatsapp' || data.channel === 'both') {
      await sendWhatsAppNotification(user, data);
    }
  } catch (error) {
    console.error('Process notification error:', error);
  }
}

async function sendEmailNotification(user: any, data: NotificationJobData) {
  const { type, data: payload } = data;
  let subject = '';
  let html = '';

  switch (type) {
    case 'welcome':
      subject = 'Selamat Datang di Online Course';
      html = welcomeEmailTemplate({ name: user.full_name || 'Student' });
      break;
    case 'enrollment_success':
      subject = 'Pendaftaran Kursus Berhasil';
      html = enrollmentSuccessEmailTemplate({
        name: user.full_name || 'Student',
        courseName: payload.courseName as string,
        price: payload.price as number,
        enrolledAt: payload.enrolledAt as string,
      });
      break;
    case 'course_completion':
      subject = 'Selamat! Kursus Selesai';
      html = courseCompletionEmailTemplate({
        name: user.full_name || 'Student',
        courseName: payload.courseName as string,
        certificateUrl: payload.certificateUrl as string,
      });
      break;
    case 'payment_failed':
      subject = 'Pembayaran Gagal';
      html = paymentFailedEmailTemplate({
        name: user.full_name || 'Student',
        courseName: payload.courseName as string,
        amount: payload.amount as number,
      });
      break;
  }

  if (subject && html && user.email) {
    await sendEmail({ to: user.email, subject, html });
  }
}

async function sendWhatsAppNotification(user: any, data: NotificationJobData) {
  const { type, data: payload } = data;

  if (!user.phone_number) {
    return;
  }

  const phone = formatPhoneNumber(user.phone_number);
  let message = '';

  switch (type) {
    case 'enrollment_success':
      message = enrollmentSuccessWA(
        user.full_name || 'Student',
        payload.courseName as string
      );
      break;
    case 'course_completion':
      message = courseCompletionWA(
        user.full_name || 'Student',
        payload.courseName as string,
        payload.certificateUrl as string
      );
      break;
    case 'payment_failed':
      message = paymentReminderWA(
        user.full_name || 'Student',
        payload.courseName as string,
        payload.amount as number
      );
      break;
  }

  if (message) {
    await sendWhatsApp({ target: phone, message });
  }
}

// Convenience functions
export async function sendEnrollmentNotification(
  userId: string,
  courseName: string,
  price: number
) {
  await addNotificationJob({
    userId,
    type: 'enrollment_success',
    channel: 'both',
    data: {
      courseName,
      price,
      enrolledAt: new Date().toISOString(),
    },
  });
}

export async function sendCompletionNotification(
  userId: string,
  courseName: string,
  certificateUrl: string
) {
  await addNotificationJob({
    userId,
    type: 'course_completion',
    channel: 'both',
    data: {
      courseName,
      certificateUrl,
    },
  });
}

export async function sendWelcomeNotification(userId: string) {
  await addNotificationJob({
    userId,
    type: 'welcome',
    channel: 'email',
    data: {},
  });
}