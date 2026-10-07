'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [orderData, setOrderData] = useState({
    serviceId: '',
    universityId: '',
    facultyId: '',
    departmentId: '',
    topic: '',
    studentName: '',
    instructorName: '',
    additionalReqs: '',
  });

  useEffect(() => {
    // In production, we'd fetch this from the API routes we created
    const loadData = async () => {
      try {
        const [srvRes, uniRes] = await Promise.all([
          fetch('/api/services').then(res => res.json()),
          fetch('/api/universities').then(res => res.json())
        ]);
        
        if (Array.isArray(srvRes)) setServices(srvRes);
        if (Array.isArray(uniRes)) setUniversities(uniRes);
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate payment creation and redirect to Payriff
    alert('Bizi Payriff ödəmə səhifəsinə yönləndirirsiniz (Simulyasiya deyil, gerçək sistemdə API işə düşəcək)');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <p>Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 0', maxWidth: '800px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Yeni Sifariş</h1>
      
      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            style={{ 
              height: '4px', 
              flex: 1, 
              background: step >= i ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              transition: 'background 0.3s ease'
            }} 
          />
        ))}
      </div>

      <div className="card">
        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>1. Xidmət seçimi</h2>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {services.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Heç bir xidmət tapılmadı.</p>
                ) : (
                  services.map(srv => (
                    <label 
                      key={srv.id}
                      style={{
                        padding: '20px',
                        border: orderData.serviceId === srv.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: orderData.serviceId === srv.id ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <input 
                          type="radio" 
                          name="service" 
                          value={srv.id}
                          checked={orderData.serviceId === srv.id}
                          onChange={(e) => setOrderData({...orderData, serviceId: e.target.value})}
                          style={{ display: 'none' }}
                        />
                        <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{srv.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{srv.description}</p>
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{srv.priceAzn} AZN</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>2. Universitet məlumatları</h2>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Universitet</label>
                <select 
                  required
                  value={orderData.universityId}
                  onChange={(e) => setOrderData({...orderData, universityId: e.target.value, facultyId: '', departmentId: ''})}
                  style={{
                    width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.5)',
                    border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none'
                  }}
                >
                  <option value="">Seçin...</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              {orderData.universityId && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Fakültə (İxtiyari)</label>
                  <select 
                    value={orderData.facultyId}
                    onChange={(e) => setOrderData({...orderData, facultyId: e.target.value, departmentId: ''})}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.5)',
                      border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none'
                    }}
                  >
                    <option value="">Seçin...</option>
                    {universities.find(u => u.id === orderData.universityId)?.faculties?.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>3. İşin detalları</h2>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Mövzu</label>
                <input 
                  type="text" 
                  required
                  value={orderData.topic}
                  onChange={(e) => setOrderData({...orderData, topic: e.target.value})}
                  style={{
                    width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.5)',
                    border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none'
                  }}
                  placeholder="Məs: Kvant fizikasının əsasları"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Tələbə adı</label>
                  <input 
                    type="text" 
                    required
                    value={orderData.studentName}
                    onChange={(e) => setOrderData({...orderData, studentName: e.target.value})}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.5)',
                      border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Rəhbər/Müəllim adı</label>
                  <input 
                    type="text" 
                    value={orderData.instructorName}
                    onChange={(e) => setOrderData({...orderData, instructorName: e.target.value})}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.5)',
                      border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Əlavə tələblər</label>
                <textarea 
                  rows={4}
                  value={orderData.additionalReqs}
                  onChange={(e) => setOrderData({...orderData, additionalReqs: e.target.value})}
                  style={{
                    width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.5)',
                    border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none', resize: 'vertical'
                  }}
                  placeholder="İstənilən xüsusi tələbləri buraya yazın..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>4. İcmal və Ödəniş</h2>
              
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mövzu:</span>
                  <span style={{ fontWeight: '500' }}>{orderData.topic || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Xidmət:</span>
                  <span style={{ fontWeight: '500' }}>
                    {services.find(s => s.id === orderData.serviceId)?.name || '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Yekun məbləğ:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'var(--primary)' }}>
                    {services.find(s => s.id === orderData.serviceId)?.priceAzn || '0'} AZN
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
                "Ödəniş et" düyməsinə basdıqda Kapital Bank Payriff sisteminə yönləndiriləcəksiniz.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
            {step > 1 ? (
              <button type="button" onClick={handlePrev} className="btn btn-secondary">Geri</button>
            ) : (
              <div></div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={step === 1 && !orderData.serviceId}
            >
              {step === 4 ? 'Ödəniş et' : 'Növbəti'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
