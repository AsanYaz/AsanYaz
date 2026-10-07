import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export default async function BootstrapPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not logged in
  if (!user) {
    redirect('/login?redirect=/admin/bootstrap');
  }

  // Check if bootstrap is already completed
  const existingBootstrap = await prisma.adminBootstrap.findFirst();
  if (existingBootstrap) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h1 style={{ color: '#EF4444' }}>Giriş Qadağandır</h1>
        <p style={{ marginTop: '16px' }}>Sistem artıq inisializasiya edilib.</p>
      </div>
    );
  }

  // Server Action to process the bootstrap
  async function performBootstrap(formData: FormData) {
    'use server';
    const secret = formData.get('secret') as string;
    
    if (secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      throw new Error('Yanlış bootstrap şifrəsi');
    }

    const supabaseClient = await createServerSupabaseClient();
    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    if (!currentUser) throw new Error('İstifadəçi tapılmadı');

    await prisma.$transaction(async (tx) => {
      // Elevate current user to super_admin
      await tx.user.update({
        where: { supabaseId: currentUser.id },
        data: { role: 'super_admin' }
      });

      // Record the bootstrap event
      await tx.adminBootstrap.create({
        data: {
          email: currentUser.email!,
          userId: currentUser.id,
        }
      });
      
      // Log the action
      await tx.auditLog.create({
        data: {
          action: 'admin_action',
          entityType: 'system',
          details: { message: 'System bootstrapped and super_admin assigned' },
          userId: currentUser.id
        }
      });
    });

    redirect('/admin');
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Sistem İnisializasiyası</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
          Mövcud hesabınızı <strong>Super Admin</strong> olaraq təyin etmək üçün gizli şifrəni daxil edin. Bu əməliyyat yalnız bir dəfə yerinə yetirilə bilər.
        </p>

        <form action={performBootstrap} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="secret" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Bootstrap Şifrəsi</label>
            <input 
              type="password" 
              id="secret" 
              name="secret" 
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
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '8px' }}>
            Admin Təyin Et
          </button>
        </form>
      </div>
    </div>
  );
}
