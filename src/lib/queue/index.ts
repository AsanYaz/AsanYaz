/**
 * Redis & BullMQ Queue System
 * Handles async job processing for AI generation & document creation.
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

let _redis: IORedis | null = null;

/**
 * Get shared Redis connection.
 */
export function getRedisConnection(): IORedis {
  if (_redis) return _redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error(
      'Missing required credential: REDIS_URL\n' +
      'Provider: Redis (Upstash, Railway, etc.)\n' +
      'Purpose: Job queue for async AI/document processing\n' +
      'Where to obtain: Your Redis provider dashboard'
    );
  }

  _redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });

  return _redis;
}

// ---- Queue Names ----
export const QUEUE_NAMES = {
  ORDER_PROCESSING: 'order-processing',
  DOCUMENT_GENERATION: 'document-generation',
  TEMPLATE_ANALYSIS: 'template-analysis',
  EMAIL_NOTIFICATION: 'email-notification',
} as const;

// ---- Job Data Types ----

export interface OrderProcessingJobData {
  orderId: string;
  userId: string;
  serviceId: string;
  attempt: number;
}

export interface DocumentGenerationJobData {
  orderId: string;
  content: string;
  templateId: string;
  outputFormats: string[];
}

export interface TemplateAnalysisJobData {
  templateId: string;
  fileKey: string;
  fileType: string;
}

export interface EmailNotificationJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ---- Queue Instances ----

let _queues: Map<string, Queue> = new Map();

export function getQueue(name: string): Queue {
  if (_queues.has(name)) return _queues.get(name)!;

  const connection = getRedisConnection();
  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  });

  _queues.set(name, queue);
  return queue;
}

/**
 * Add an order processing job to the queue.
 */
export async function enqueueOrderProcessing(data: OrderProcessingJobData): Promise<string> {
  const queue = getQueue(QUEUE_NAMES.ORDER_PROCESSING);
  
  const job = await queue.add('process-order', data, {
    jobId: `order-${data.orderId}-${data.attempt}`,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  });

  return job.id || '';
}

/**
 * Add a document generation job to the queue.
 */
export async function enqueueDocumentGeneration(data: DocumentGenerationJobData): Promise<string> {
  const queue = getQueue(QUEUE_NAMES.DOCUMENT_GENERATION);
  
  const job = await queue.add('generate-document', data, {
    jobId: `doc-${data.orderId}`,
    attempts: 2,
  });

  return job.id || '';
}

/**
 * Add a template analysis job to the queue.
 */
export async function enqueueTemplateAnalysis(data: TemplateAnalysisJobData): Promise<string> {
  const queue = getQueue(QUEUE_NAMES.TEMPLATE_ANALYSIS);
  
  const job = await queue.add('analyze-template', data, {
    jobId: `tpl-${data.templateId}`,
    attempts: 2,
  });

  return job.id || '';
}

/**
 * Add an email notification to the queue.
 */
export async function enqueueEmail(data: EmailNotificationJobData): Promise<string> {
  const queue = getQueue(QUEUE_NAMES.EMAIL_NOTIFICATION);
  
  const job = await queue.add('send-email', data, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  });

  return job.id || '';
}

/**
 * Create a worker for processing jobs.
 * This should be called in a separate worker process.
 */
export function createWorker<T>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>,
  concurrency: number = 1
): Worker<T> {
  const connection = getRedisConnection();

  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency,
    limiter: {
      max: 10,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed in queue ${queueName}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed in queue ${queueName}:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(`Worker error in queue ${queueName}:`, err.message);
  });

  return worker;
}
