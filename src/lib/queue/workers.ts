import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './connection';
import { NotificationJobData, EmailJobData, WhatsAppJobData } from './queues';
import { createClient } from '@/lib/supabase/server';
import {
  sendEmail,
  welcomeEmailTemplate,
  enrollmentSuccessEmailTemplate,
  courseCompletionEmailTemplate,
  paymentFailedEmailTemplate,
} from '@/lib/resend';
import { sendWhatsApp, formatPhoneNumber, enrollmentSuccessWA, courseCompletionWA, paymentReminderWA } from '@/lib/fonnte';

// Email Worker
export function startEmailWorker() {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<EmailJobData>(
    'emails',
    async (job: Job<EmailJobData>) => {
      const { to, subject, html } = job.data;

      const result = await sendEmail({ to, subject, html });

      if (!result.success) {
        throw new Error(String(result.error) || 'Failed to send email');
      }

      return result;
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err);
  });

  return worker;
}

// WhatsApp Worker
export function startWhatsAppWorker() {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<WhatsAppJobData>(
    'whatsapp',
    async (job: Job<WhatsAppJobData>) => {
      const { phone, message } = job.data;

      const result = await sendWhatsApp({ target: phone, message });

      if (!result.status) {
        throw new Error(result.reason || 'Failed to send WhatsApp');
      }

      return result;
    },
    {
      connection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    console.log(`WhatsApp job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`WhatsApp job ${job?.id} failed:`, err);
  });

  return worker;
}

// Notification Worker (dispatches to email/whatsapp queues)
export function startNotificationWorker() {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      const { userId, type, channel, data } = job.data;

      // Get user info
      const supabase = await createClient();
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // Log notification
      await supabase.from('notifications_log').insert({
        user_id: userId,
        channel,
        type,
        subject: getNotificationSubject(type),
        status: 'pending',
      });

      // Process based on channel
      if (channel === 'email' || channel === 'both') {
        await processEmailNotification(user, type, data);
      }

      if (channel === 'whatsapp' || channel === 'both') {
        await processWhatsAppNotification(user, type, data);
      }

      return { success: true };
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Notification job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Notification job ${job?.id} failed:`, err);
  });

  return worker;
}

function getNotificationSubject(type: string): string {
  switch (type) {
    case 'welcome':
      return 'Selamat Datang';
    case 'enrollment_success':
      return 'Pendaftaran Berhasil';
    case 'course_completion':
      return 'Kursus Selesai';
    case 'payment_failed':
      return 'Pembayaran Gagal';
    default:
      return 'Notifikasi';
  }
}

async function processEmailNotification(user: any, type: string, data: Record<string, unknown>) {
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
        courseName: data.courseName as string,
        price: data.price as number,
        enrolledAt: data.enrolledAt as string,
      });
      break;
    case 'course_completion':
      subject = 'Selamat! Kursus Selesai';
      html = courseCompletionEmailTemplate({
        name: user.full_name || 'Student',
        courseName: data.courseName as string,
        certificateUrl: data.certificateUrl as string,
      });
      break;
    case 'payment_failed':
      subject = 'Pembayaran Gagal';
      html = paymentFailedEmailTemplate({
        name: user.full_name || 'Student',
        courseName: data.courseName as string,
        amount: data.amount as number,
      });
      break;
  }

  if (subject && html && user.email) {
    await sendEmail({ to: user.email, subject, html });
  }
}

async function processWhatsAppNotification(user: any, type: string, data: Record<string, unknown>) {
  if (!user.phone_number) return;

  const phone = formatPhoneNumber(user.phone_number);
  let message = '';

  switch (type) {
    case 'enrollment_success':
      message = enrollmentSuccessWA(
        user.full_name || 'Student',
        data.courseName as string
      );
      break;
    case 'course_completion':
      message = courseCompletionWA(
        user.full_name || 'Student',
        data.courseName as string,
        data.certificateUrl as string
      );
      break;
    case 'payment_failed':
      message = paymentReminderWA(
        user.full_name || 'Student',
        data.courseName as string,
        data.amount as number
      );
      break;
  }

  if (message) {
    await sendWhatsApp({ target: phone, message });
  }
}