import { createWorker, QUEUE_NAMES } from '../lib/queue';
import { processOrderJob } from './order-processor';
// In a real app we'd import doc generator and email sender too

console.log('Starting AsanYaz Queue Workers...');

// Start the order processor worker
const orderWorker = createWorker(
  QUEUE_NAMES.ORDER_PROCESSING,
  processOrderJob,
  5 // concurrency
);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await orderWorker.close();
  process.exit(0);
});

console.log('Workers started successfully.');
