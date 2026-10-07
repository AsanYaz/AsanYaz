import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getQueue } from '@/lib/queue';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Resend } from 'resend';
import { getPaymentProvider } from '@/lib/payment/provider';
import { getAIProvider } from '@/lib/ai/provider';

export async function GET() {
  const status: Record<string, any> = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // 1. Prisma Connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      status.checks.prisma = 'ok';
    } catch (e: any) {
      status.checks.prisma = { error: e.message };
    }

    // 2. Supabase Connectivity
    try {
      const supabase = await createServerSupabaseClient();
      // A simple lightweight call to check configuration
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      status.checks.supabase = 'ok';
    } catch (e: any) {
      status.checks.supabase = { error: e.message };
    }

    // 3. Redis Connectivity
    try {
      const { getRedisConnection } = await import('@/lib/queue');
      const redis = getRedisConnection();
      const pong = await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout (5s)')), 5000))
      ]);
      status.checks.redis = pong === 'PONG' ? 'ok' : { error: `Unexpected ping response: ${pong}` };
    } catch (e: any) {
      status.checks.redis = { error: e.message };
    }

    // 4. Cloudflare R2 Configuration
    try {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY!,
          secretAccessKey: process.env.R2_SECRET_KEY!,
        },
      });
      // Check bucket access instead of account access
      await s3.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET!, MaxKeys: 1 }));
      status.checks.r2 = 'ok';
    } catch (e: any) {
      status.checks.r2 = { error: e.message };
    }

    // 5. Payriff Configuration
    try {
      // Just instantiate to check variables
      getPaymentProvider();
      status.checks.payriff = 'configured (no external call made)';
    } catch (e: any) {
      status.checks.payriff = { error: e.message };
    }

    // 6. Resend Configuration
    try {
      if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
      const resend = new Resend(process.env.RESEND_API_KEY);
      // We don't want to actually send, so just passing the check
      status.checks.resend = 'configured';
    } catch (e: any) {
      status.checks.resend = { error: e.message };
    }

    // 7. Gemini Configuration
    try {
      // Just instantiate to check variables
      getAIProvider();
      status.checks.gemini = 'configured (no external call made)';
    } catch (e: any) {
      status.checks.gemini = { error: e.message };
    }

    status.status = Object.values(status.checks).some(c => typeof c === 'object' && c !== null) 
      ? 'degraded' 
      : 'healthy';

    return NextResponse.json(status, { status: status.status === 'healthy' ? 200 : 500 });
  } catch (error: any) {
    return NextResponse.json({ status: 'failed', error: error.message }, { status: 500 });
  }
}
