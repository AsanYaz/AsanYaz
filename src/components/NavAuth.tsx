'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NavAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return <div className="auth-links" style={{ opacity: 0.5 }}>Yüklənir...</div>;
  }

  if (session?.user) {
    // Get display name, default to email
    const name = session.user.user_metadata?.first_name 
      ? `${session.user.user_metadata.first_name}` 
      : session.user.email;

    return (
      <div className="auth-links" style={{ alignItems: 'center' }}>
        <Link href="/dashboard" style={{ marginRight: '16px', fontWeight: '500', color: 'var(--text-main)' }}>
          {name}
        </Link>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          Çıxış
        </button>
      </div>
    );
  }

  return (
    <div className="auth-links">
      <Link href="/login" className="btn btn-secondary">Giriş</Link>
      <Link href="/register" className="btn btn-primary">Qeydiyyat</Link>
    </div>
  );
}
