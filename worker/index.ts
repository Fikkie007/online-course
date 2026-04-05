import {
  startEmailWorker,
  startWhatsAppWorker,
  startNotificationWorker,
} from '../src/lib/queue/workers';

console.log('Starting notification workers...');

const emailWorker = startEmailWorker();
const whatsappWorker = startWhatsAppWorker();
const notificationWorker = startNotificationWorker();

if (!emailWorker && !whatsappWorker && !notificationWorker) {
  console.error('No workers started. Check REDIS_URL configuration.');
  process.exit(1);
}

console.log('Workers started successfully');

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down workers...');

  if (emailWorker) await emailWorker.close();
  if (whatsappWorker) await whatsappWorker.close();
  if (notificationWorker) await notificationWorker.close();

  console.log('Workers shut down complete');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);