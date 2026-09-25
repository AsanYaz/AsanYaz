import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import { processOrder } from './processors/order-processor';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Order processing queue
const orderQueue = new Queue('order-processing', { connection });

// Worker to process orders
const worker = new Worker(
  'order-processing',
  async (job) => {
    console.log(`🔄 Processing order: ${job.data.orderId}`);
    await processOrder(job.data, pool);
    console.log(`✅ Order completed: ${job.data.orderId}`);
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3'),
    limiter: {
      max: 5,
      duration: 60000, // 5 jobs per minute max
    },
  },
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed for order ${job.data.orderId}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('🚀 AsanYaz Worker started');
console.log(`📋 Concurrency: ${process.env.WORKER_CONCURRENCY || '3'}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Worker shutting down...');
  await worker.close();
  await connection.quit();
  await pool.end();
  process.exit(0);
});

export { orderQueue };
