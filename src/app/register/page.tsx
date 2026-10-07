import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Qeydiyyat</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          AsanYaz-da yeni hesab yaradın
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Ad</label>
              <input 
                type="text" 
                id="firstName" 
                name="firstName" 
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
                placeholder="Məs. Əli"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Soyad</label>
              <input 
                type="text" 
                id="lastName" 
                name="lastName" 
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
                placeholder="Məs. Məmmədov"
              />
            </div>
          </div>

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
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Şifrə</label>
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
            Hesab yarat
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Artıq hesabınız var?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>
            Daxil olun
          </Link>
        </p>
      </div>
    </div>
  );
}
