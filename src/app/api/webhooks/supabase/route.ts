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
    
    // FIX: Convert both strings to Buffers first. 
    // crypto.timingSafeEqual will throw a TypeError (causing a 500) if the buffers have different byte lengths.
    // By checking buffer lengths instead of string lengths, we prevent the internal crash.
    const authBuf = Buffer.from(authHeader);
    const expectedBuf = Buffer.from(expectedHeader);
    
    if (authBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(authBuf, expectedBuf)) {
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
      
      if (!user || !user.id) {
        throw new Error('User record or user ID missing in payload');
      }
      
      // FIX: Use Upsert to prevent P2002 Unique Constraint race conditions during webhook retries
      await prisma.$transaction(async (tx) => {
        const userEmail = user.email || '';
        let userMeta = user.raw_user_meta_data || {};
        
        // Safety check if meta data is somehow stringified
        if (typeof userMeta === 'string') {
          try { userMeta = JSON.parse(userMeta); } catch (e) {}
        }
        
        const upsertedUser = await tx.user.upsert({
          where: { supabaseId: user.id },
          update: {
            email: userEmail,
            emailVerified: !!user.email_confirmed_at,
          },
          create: {
            supabaseId: user.id,
            email: userEmail,
            emailVerified: !!user.email_confirmed_at,
          }
        });

        // Ensure we don't recreate profile if the user upsert updated an existing user
        const existingProfile = await tx.profile.findUnique({ where: { userId: upsertedUser.id } });
        
        if (!existingProfile) {
          await tx.profile.create({
            data: {
              userId: upsertedUser.id,
              firstName: userMeta.first_name || '',
              lastName: userMeta.last_name || '',
            }
          });
        }
      });
    } else if (payload.type === 'UPDATE' && payload.table === 'users' && payload.schema === 'auth') {
      const user = payload.record;
      
      if (user && user.id) {
        // FIX: Use updateMany to prevent P2025 Record Not Found errors if user doesn't exist yet
        await prisma.user.updateMany({
          where: { supabaseId: user.id },
          data: {
            emailVerified: !!user.email_confirmed_at
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supabase webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
