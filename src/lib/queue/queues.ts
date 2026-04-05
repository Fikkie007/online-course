import { Queue } from 'bullmq';
import { getRedisConnection } from './connection';

let notificationQueue: Queue | null = null;
let emailQueue: Queue | null = null;
let whatsappQueue: Queue | null = null;

export function getNotificationQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;

  if (!notificationQueue) {
    notificationQueue = new Queue('notifications', { connection });
  }

  return notificationQueue;
}

export function getEmailQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;

  if (!emailQueue) {
    emailQueue = new Queue('emails', { connection });
  }

  return emailQueue;
}

export function getWhatsAppQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;

  if (!whatsappQueue) {
    whatsappQueue = new Queue('whatsapp', { connection });
  }

  return whatsappQueue;
}

// Job types
export interface NotificationJobData {
  userId: string;
  type: 'enrollment_success' | 'course_completion' | 'payment_failed' | 'welcome';
  channel: 'email' | 'whatsapp' | 'both';
  data: Record<string, unknown>;
}

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  userId: string;
  notificationType: string;
}

export interface WhatsAppJobData {
  phone: string;
  message: string;
  userId: string;
  notificationType: string;
}