import Link from 'next/link';

export default async function PublicPages({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // A catch-all structure for the static informative pages to complete the application shell
  return (
    <div className="container" style={{ padding: '80px 0', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '24px' }}>Məlumat Səhifəsi</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', lineHeight: '1.6', marginBottom: '32px' }}>
          Bu səhifə ({resolvedParams?.slug || 'ümumi'}) administrator tərəfindən idarəetmə panelindən (CMS) əlavə ediləcək məzmun üçün ayrılmışdır. Sistem infrastrukturu artıq quraşdırılmışdır.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block' }}>Ana Səhifəyə Qayıt</Link>
      </div>
    </div>
  );
}
