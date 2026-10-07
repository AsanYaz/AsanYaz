import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Xoş gəldiniz</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          AsanYaz hesabınıza daxil olun
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: '500' }}>Şifrə</label>
              <a href="/reset-password" style={{ fontSize: '14px', color: 'var(--primary)' }}>Şifrəni unutmusuz?</a>
            </div>
            <input 
              type="password" 
              id="password" 
              name="password" 
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
            Daxil ol
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Hesabınız yoxdur?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: '500' }}>
            Qeydiyyatdan keçin
          </Link>
        </p>
      </div>
    </div>
  );
}
