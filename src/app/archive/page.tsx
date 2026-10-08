import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { getSignedDownloadUrl } from '@/lib/storage/r2';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch completed orders with files
  const orders = await prisma.order.findMany({
    where: { 
      userId: user.id,
      status: 'completed'
    },
    include: {
      service: true,
      files: true,
      university: true
    },
    orderBy: {
      completedAt: 'desc'
    }
  });

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Arxiv</h1>
          <p style={{ color: 'var(--text-muted)' }}>Tamamlanmış bütün sənədləriniz burada saxlanılır.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {orders.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Arxiviniz boşdur. Hələ heç bir iş tamamlanmayıb.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {order.createdAt.toLocaleDateString('az-AZ')}
                </span>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{order.topic}</h3>
                <span style={{ 
                  display: 'inline-block',
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  background: 'rgba(255,255,255,0.1)'
                }}>
                  {order.service.name}
                </span>
              </div>
              
              <div style={{ flex: 1, marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <strong>Universitet:</strong> {order.university.name}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  <strong>Müəllim:</strong> {order.instructorName || '-'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {order.files.length > 0 ? (
                  order.files.map((file) => (
                    <DownloadButton 
                      key={file.id} 
                      storageKey={file.storageKey} 
                      fileName={file.fileName} 
                      fileType={file.fileType}
                    />
                  ))
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Fayllar tapılmadı</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Client component for downloading safely via signed URLs generated on the server
async function DownloadButton({ storageKey, fileName, fileType }: { storageKey: string, fileName: string, fileType: string }) {
  // In Next.js App Router, we can't directly use Server Actions inline like this without making the component a Client component
  // Or we can generate the URL here in the Server Component itself.
  
  let url = '#';
  try {
    url = await getSignedDownloadUrl(storageKey, 3600); // 1 hour expiry
  } catch (err) {
    console.error('Failed to generate signed url', err);
  }

  const isPdf = fileType.includes('pdf');
  const icon = isPdf ? '📄 PDF' : '📝 DOCX';

  return (
    <a 
      href={url}
      download={fileName}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        background: isPdf ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        color: isPdf ? '#EF4444' : '#3B82F6',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        border: `1px solid ${isPdf ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
      }}
    >
      {icon} Yüklə
    </a>
  );
}
