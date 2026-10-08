'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
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
    const email = formData.get('email') as string;

    if (!email) {
      setError('Email daxil edilməlidir.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--primary)' }}>E-poçt göndərildi</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            Şifrənizi yeniləmək üçün daxil etdiyiniz e-poçt ünvanına link göndərildi. Zəhmət olmasa e-poçtunuzu yoxlayın.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>
            Daxil ol səhifəsinə qayıt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Şifrənin bərpası</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Hesabınızın e-poçt ünvanını daxil edin
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Göndərilir...' : 'Bərpa linki göndər'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>
            Geri qayıt
          </Link>
        </p>
      </div>
    </div>
  );
}
