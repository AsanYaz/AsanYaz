import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id }
  });

  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  // Fetch some system stats
  const [
    totalUsers,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'customer' } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ['paid', 'queued', 'researching', 'generating', 'formatting', 'quality_check'] } } }),
    prisma.order.count({ where: { status: 'completed' } }),
    prisma.payment.aggregate({
      _sum: { amountAzn: true },
      where: { status: 'completed' }
    })
  ]);

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Admin Panel</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>AsanYaz sisteminin idarəedilməsi</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>Müştərilər</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalUsers}</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>Aktiv Sifarişlər</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{pendingOrders}</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>Tamamlanmış</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{completedOrders}</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>Ümumi Gəlir</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>
            {totalRevenue._sum.amountAzn?.toString() || '0'} AZN
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>İdarəetmə modulları</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/admin/services" className="btn btn-secondary" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              Xidmətlər və Qiymətlər
            </Link>
            <Link href="/admin/universities" className="btn btn-secondary" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              Universitetlər və Şablonlar
            </Link>
            <Link href="/admin/orders" className="btn btn-secondary" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              Bütün Sifarişlər
            </Link>
            <Link href="/admin/users" className="btn btn-secondary" style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              İstifadəçilər
            </Link>
          </div>
        </div>
        
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Sistem Statusu</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Database</span>
              <span style={{ color: '#10B981', fontWeight: '500' }}>Aktiv</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Engine (Gemini)</span>
              <span style={{ color: '#10B981', fontWeight: '500' }}>Aktiv</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Redis Queue</span>
              <span style={{ color: '#10B981', fontWeight: '500' }}>Aktiv</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Storage (R2)</span>
              <span style={{ color: '#10B981', fontWeight: '500' }}>Aktiv</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
