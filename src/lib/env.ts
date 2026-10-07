import { z } from 'zod';

/**
 * Production environment variable schema.
 * Application will refuse to start if required variables are missing.
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url('APP_URL must be a valid URL').optional(),
  PUBLIC_APP_URL: z.string().url('PUBLIC_APP_URL must be a valid URL').optional(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_WEBHOOK_SECRET: z.string().min(1, 'SUPABASE_WEBHOOK_SECRET is required'),

  // AI
  AI_PROVIDER: z.enum(['gemini']).default('gemini'),
  AI_MODEL: z.string().default('gemini-2.5-pro'),
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Cloudflare R2
  R2_ENDPOINT: z.string().url('R2_ENDPOINT must be a valid URL'),
  R2_ACCESS_KEY: z.string().min(1, 'R2_ACCESS_KEY is required'),
  R2_SECRET_KEY: z.string().min(1, 'R2_SECRET_KEY is required'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),

  // Payriff Payment
  PAYRIFF_SECRET_KEY: z.string().min(1, 'PAYRIFF_SECRET_KEY is required'),
  PAYRIFF_BASE_URL: z.string().url().default('https://api.payriff.com'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().email().default('noreply@asanyaz.com'),
  EMAIL_REPLY_TO: z.string().email().default('support@asanyaz.com'),

  // Admin
  ADMIN_BOOTSTRAP_SECRET: z.string().min(32, 'ADMIN_BOOTSTRAP_SECRET must be at least 32 characters'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * Validate and return environment variables.
 * Throws a detailed error if any required variable is missing.
 */
export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `  ✗ ${path}: ${issue.message}`;
    });

    const errorMessage = [
      '',
      '╔══════════════════════════════════════════════════════════╗',
      '║        AsanYaz — Configuration Error                    ║',
      '╠══════════════════════════════════════════════════════════╣',
      '║  Required environment variables are missing or invalid. ║',
      '╚══════════════════════════════════════════════════════════╝',
      '',
      'Missing or invalid variables:',
      ...missing,
      '',
      'Please check your .env file or environment configuration.',
      'See .env.example for the complete list of required variables.',
      '',
    ].join('\n');

    console.error(errorMessage);
    throw new Error(`Configuration validation failed:\n${missing.join('\n')}`);
  }

  _env = result.data;
  return _env;
}

/**
 * Check if we're in production mode.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get a public-safe subset of config (no secrets).
 */
export function getPublicConfig() {
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  const defaultUrl = vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000';

  return {
    appUrl: process.env.PUBLIC_APP_URL || process.env.APP_URL || defaultUrl,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}
