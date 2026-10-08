'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
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
    const password = formData.get('password') as string;

    if (!password) {
      setError('Yeni şifrə daxil edilməlidir.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Şifrəni yeniləyərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Uğurlu!</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            Şifrəniz uğurla yeniləndi. İdarəetmə panelinə yönləndirilirsiniz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Yeni Şifrə</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Hesabınız üçün yeni şifrə təyin edin
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Yeni Şifrə</label>
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
            {loading ? 'Yenilənir...' : 'Şifrəni Yenilə'}
          </button>
        </form>
      </div>
    </div>
  );
}
