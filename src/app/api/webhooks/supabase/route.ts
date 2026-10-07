import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Supabase webhook secret used to verify requests
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const authHeader = request.headers.get('authorization') || '';
    
    if (!WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured securely' }, { status: 500 });
    }

    const expectedHeader = `Bearer ${WEBHOOK_SECRET}`;
    if (
      authHeader.length !== expectedHeader.length ||
      !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedHeader))
    ) {
      return NextResponse.json({ error: 'Unauthorized payload signature' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    // Ensure it's an insert to auth.users
    if (payload.type === 'INSERT' && payload.table === 'users' && payload.schema === 'auth') {
      const user = payload.record;
      
      // Use Upsert to ensure idempotency (in case of webhook retries)
      await prisma.$transaction(async (tx) => {
        const userEmail = user.email || '';
        const userMeta = user.raw_user_meta_data || {};
        
        const existingUser = await tx.user.findUnique({ where: { supabaseId: user.id } });
        
        if (!existingUser) {
          const newUser = await tx.user.create({
            data: {
              supabaseId: user.id,
              email: userEmail,
              emailVerified: !!user.email_confirmed_at,
            }
          });

          await tx.profile.create({
            data: {
              userId: newUser.id,
              firstName: userMeta.first_name || '',
              lastName: userMeta.last_name || '',
            }
          });
        }
      });
    } else if (payload.type === 'UPDATE' && payload.table === 'users' && payload.schema === 'auth') {
      const user = payload.record;
      // Update user verification status if changed
      await prisma.user.update({
        where: { supabaseId: user.id },
        data: {
          emailVerified: !!user.email_confirmed_at
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supabase webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
