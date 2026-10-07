import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // Handled by middleware
  }

  // Fetch user data and recent orders from Prisma DB
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      profile: true,
      orders: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { service: true }
      }
    }
  });

  const firstName = dbUser?.profile?.firstName || 'İstifadəçi';

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Salam, {firstName}</h1>
          <p style={{ color: 'var(--text-muted)' }}>AsanYaz idarəetmə panelinə xoş gəldiniz.</p>
        </div>
        <Link href="/order" className="btn btn-primary" style={{ padding: '12px 24px' }}>
          + Yeni sifariş
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Aktiv Sifarişlər</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {dbUser?.orders.filter(o => ['queued', 'researching', 'generating', 'formatting', 'quality_check'].includes(o.status)).length || 0}
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Tamamlanmış</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {dbUser?.orders.filter(o => o.status === 'completed').length || 0}
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Arxiv</h3>
          <Link href="/archive" style={{ color: 'var(--primary)', fontWeight: '500' }}>Sənədlərə bax →</Link>
        </div>
      </div>

      <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Son sifarişlər</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 24px', fontWeight: '500', color: 'var(--text-muted)' }}>Sifariş NO</th>
              <th style={{ padding: '16px 24px', fontWeight: '500', color: 'var(--text-muted)' }}>Xidmət</th>
              <th style={{ padding: '16px 24px', fontWeight: '500', color: 'var(--text-muted)' }}>Tarix</th>
              <th style={{ padding: '16px 24px', fontWeight: '500', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '500', color: 'var(--text-muted)' }}>Qiymət</th>
            </tr>
          </thead>
          <tbody>
            {dbUser?.orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Hələ heç bir sifarişiniz yoxdur.
                </td>
              </tr>
            ) : (
              dbUser?.orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <Link href={`/order/${order.id}`} style={{ color: 'var(--primary)', fontWeight: '500' }}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '16px 24px' }}>{order.service.name}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                    {order.createdAt.toLocaleDateString('az-AZ')}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '16px', 
                      fontSize: '12px', 
                      fontWeight: '500',
                      background: order.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                      color: order.status === 'completed' ? '#10B981' : '#818CF8'
                    }}>
                      {order.status === 'completed' ? 'Tamamlandı' : 
                       order.status === 'draft' ? 'Qaralama' : 
                       order.status === 'awaiting_payment' ? 'Ödəniş gözləyir' : 'Emal olunur'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>{order.priceAzn.toString()} AZN</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
