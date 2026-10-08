'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !firstName || !lastName) {
      setError('Bütün xanalar doldurulmalıdır.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.session) {
        // Logged in immediately (email verification is likely disabled)
        router.push('/dashboard');
        router.refresh();
      } else if (data.user) {
        // User created but needs email confirmation
        setSuccess(true);
      } else {
        throw new Error('Gözlənilməz xəta baş verdi.');
      }
    } catch (err: any) {
      setError(err.message || 'Qeydiyyat zamanı xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Qeydiyyat Uğurlu!</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            Hesabınız yaradıldı. Zəhmət olmasa, e-poçt ünvanınıza göndərilən təsdiq linkinə klikləyərək hesabınızı aktivləşdirin.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>
            Daxil ol
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Qeydiyyat</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          AsanYaz-da yeni hesab yaradın
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ad</label>
              <input 
                type="text" 
                id="firstName" 
                name="firstName" 
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                placeholder="Məs. Əli"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Soyad</label>
              <input 
                type="text" 
                id="lastName" 
                name="lastName" 
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                placeholder="Məs. Məmmədov"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              placeholder="ad@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Şifrə</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Gözləyin...' : 'Hesab yarat'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Artıq hesabınız var?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>
            Daxil olun
          </Link>
        </p>
      </div>
    </div>
  );
}
