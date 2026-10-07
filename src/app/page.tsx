import Link from 'next/link';

export default function Home() {
  return (
    <>
      <section className="hero container">
        <h1>
          Akademik işlərin <br />
          <span style={{ color: 'var(--primary)' }}>daha asan.</span>
        </h1>
        <p>
          AsanYaz ilə akademik sənədlərinizi, sərbəst işlərinizi və diplom işlərinizi
          ən yüksək standartlara uyğun, asanlıqla yaradın.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '18px' }}>
            Yeni sifariş
          </Link>
          <Link href="/services" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '18px' }}>
            Xidmətlərə bax
          </Link>
        </div>

        <div className="features-grid">
          <div className="card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3>Universitet Formatı</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
              Universitetinizin rəsmi standartlarına və şablonlarına tam uyğun avtomatik formatlama.
            </p>
          </div>

          <div className="card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3>Sabit Qiymətlər</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
              Səhifə sayına görə deyil, xidmət növünə görə sabit və ədalətli qiymətləndirmə.
            </p>
          </div>

          <div className="card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3>Sürətli Təhvil</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
              Süni intellekt dəstəyi ilə akademik işlərinizin sürətli və keyfiyyətli hazırlanması.
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '100px 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '64px' }}>Necə işləyir?</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 24px', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)' }}>1</div>
            <h3>Məlumatları daxil et</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Xidmət, universitet və mövzu detallarını seçin.</p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 24px', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)' }}>2</div>
            <h3>Ödəniş et</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Təhlükəsiz sistem vasitəsilə sabit ödənişi tamamlayın.</p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 24px', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)' }}>3</div>
            <h3>Nəticəni yüklə</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Hazır sənədinizi PDF və DOCX formatlarında arxivinizdən yükləyin.</p>
          </div>
        </div>
      </section>
    </>
  );
}
