'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { error: 'Email və şifrə daxil edilməlidir' };
  }

  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  if (!email || !password || !firstName || !lastName) {
    return { error: 'Bütün xanalar doldurulmalıdır' };
  }

  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  // After registration, sync to Prisma Database (this can also be done via Supabase Webhooks)
  // For production, Supabase Auth Webhooks to an API route is safer for database syncing.
  
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
