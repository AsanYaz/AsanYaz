import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Interfaces for our data
interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  required_fields: any[];
}

interface University {
  id: string;
  name: string;
  short_name: string;
}

interface Faculty {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function OrderWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [services, setServices] = useState<Service[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  
  const [topic, setTopic] = useState('');
  const [studentName, setStudentName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [requestedLength, setRequestedLength] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [language, setLanguage] = useState('az');
  
  const [submitting, setSubmitting] = useState(false);

  // API instance
  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('asanyaz_token') : ''}`
    }
  });

  // Initial data load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesRes, uniRes, profileRes] = await Promise.all([
          api.get('/services'),
          api.get('/universities'),
          api.get('/users/profile')
        ]);
        
        setServices(servicesRes.data.data);
        setUniversities(uniRes.data.data);
        
        // Pre-fill profile info if exists
        const profile = profileRes.data.data;
        if (profile) {
          setStudentName(`${profile.first_name} ${profile.last_name}`);
          if (profile.university_id) setSelectedUniversity(profile.university_id);
          // In a real app, we'd also load and select faculty/dept based on profile
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Məlumatları yükləmək mümkün olmadı.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch faculties when university changes
  useEffect(() => {
    if (selectedUniversity) {
      api.get(`/universities/${selectedUniversity}/faculties`)
        .then(res => setFaculties(res.data.data))
        .catch(console.error);
    } else {
      setFaculties([]);
      setSelectedFaculty('');
    }
  }, [selectedUniversity]);

  // Fetch departments when faculty changes
  useEffect(() => {
    if (selectedFaculty) {
      api.get(`/universities/faculties/${selectedFaculty}/departments`)
        .then(res => setDepartments(res.data.data))
        .catch(console.error);
    } else {
      setDepartments([]);
      setSelectedDepartment('');
    }
  }, [selectedFaculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      // 1. Create order
      const orderData = {
        serviceId: selectedService,
        universityId: selectedUniversity,
        facultyId: selectedFaculty || undefined,
        departmentId: selectedDepartment || undefined,
        topic,
        studentName,
        instructorName: instructorName || undefined,
        requestedLength: requestedLength ? parseInt(requestedLength) : undefined,
        additionalRequirements: additionalRequirements || undefined,
        language
      };
      
      const orderRes = await api.post('/orders', orderData);
      const orderId = orderRes.data.data.id;
      
      // 2. Create payment session
      const paymentRes = await api.post('/payments/create', { orderId });
      
      // 3. Redirect to payment (simulated)
      // In production, window.location.href = paymentRes.data.data.checkoutUrl
      
      // For MVP, we simulate successful payment by hitting the confirm endpoint directly
      await api.post(`/payments/confirm/${paymentRes.data.data.paymentId}`);
      
      // Redirect to orders page
      window.location.href = '/dashboard/orders';
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sifariş yaratmaq mümkün olmadı.');
      setSubmitting(false);
    }
  };

  const currentService = services.find(s => s.id === selectedService);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-200" aria-hidden="true"></div>
          <div className="absolute left-0 top-1/2 -mt-px h-0.5 bg-primary-500 transition-all duration-300" style={{ width: \`\${((step - 1) / 2) * 100}%\` }} aria-hidden="true"></div>
          
          <div className={\`relative flex items-center justify-center w-8 h-8 rounded-full \${step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'} font-bold text-sm ring-4 ring-gray-50\`}>
            1
          </div>
          <div className={\`relative flex items-center justify-center w-8 h-8 rounded-full \${step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'} font-bold text-sm ring-4 ring-gray-50\`}>
            2
          </div>
          <div className={\`relative flex items-center justify-center w-8 h-8 rounded-full \${step >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'} font-bold text-sm ring-4 ring-gray-50\`}>
            3
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
          <span className={step >= 1 ? 'text-primary-600' : ''}>Xidmət</span>
          <span className={step >= 2 ? 'text-primary-600' : ''}>Universitet</span>
          <span className={step >= 3 ? 'text-primary-600' : ''}>Detallar</span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-100">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>
          
          {/* STEP 1: SERVICE */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Xidməti seçin</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map(service => (
                  <label 
                    key={service.id}
                    className={\`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none transition-colors \${selectedService === service.id ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}\`}
                  >
                    <input 
                      type="radio" 
                      name="service" 
                      value={service.id} 
                      checked={selectedService === service.id}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="sr-only" 
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">{service.name}</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">{service.description}</span>
                        <span className="mt-2 text-lg font-bold text-primary-600">{service.price} AZN</span>
                      </div>
                    </div>
                    <svg className={\`h-5 w-5 text-primary-600 \${selectedService === service.id ? 'block' : 'hidden'}\`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İrəli &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: UNIVERSITY */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Universitet məlumatları</h2>
              <p className="text-sm text-gray-500 mb-6">Bütün formatlama qaydaları seçdiyiniz universitetin rəsmi standartlarına uyğun olacaq.</p>
              
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Universitet *</label>
                  <select 
                    required
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="input-field py-2 px-3 border border-gray-300"
                  >
                    <option value="">-- Seçin --</option>
                    {universities.map(uni => (
                      <option key={uni.id} value={uni.id}>{uni.name} ({uni.short_name})</option>
                    ))}
                  </select>
                </div>

                {faculties.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fakültə (İstəyə bağlı)</label>
                    <select 
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      className="input-field py-2 px-3 border border-gray-300"
                    >
                      <option value="">-- Seçin --</option>
                      {faculties.map(fac => (
                        <option key={fac.id} value={fac.id}>{fac.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {departments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kafedra (İstəyə bağlı)</label>
                    <select 
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="input-field py-2 px-3 border border-gray-300"
                    >
                      <option value="">-- Seçin --</option>
                      {departments.map(dep => (
                        <option key={dep.id} value={dep.id}>{dep.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  &larr; Geri
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(3)}
                  disabled={!selectedUniversity}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İrəli &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS & PAY */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-4">İşin detalları</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mövzu *</label>
                    <input 
                      type="text" 
                      required 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="input-field py-2 px-3 border border-gray-300" 
                      placeholder="Məs: Kriptoqrafiya alqoritmləri"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tələbənin tam adı *</label>
                    <input 
                      type="text" 
                      required 
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="input-field py-2 px-3 border border-gray-300" 
                      placeholder="Başlıq səhifəsi üçün"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Səhifə sayı</label>
                      <input 
                        type="number" 
                        value={requestedLength}
                        onChange={(e) => setRequestedLength(e.target.value)}
                        className="input-field py-2 px-3 border border-gray-300" 
                        placeholder="Məs: 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="input-field py-2 px-3 border border-gray-300"
                      >
                        <option value="az">Azərbaycan</option>
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Elmi rəhbər / Müəllim</label>
                    <input 
                      type="text" 
                      value={instructorName}
                      onChange={(e) => setInstructorName(e.target.value)}
                      className="input-field py-2 px-3 border border-gray-300" 
                      placeholder="Başlıq səhifəsi üçün (İstəyə bağlı)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Əlavə tələblər</label>
                    <textarea 
                      rows={3}
                      value={additionalRequirements}
                      onChange={(e) => setAdditionalRequirements(e.target.value)}
                      className="input-field py-2 px-3 border border-gray-300"
                      placeholder="Əlavə etmək istədiyiniz xüsusi qeydlər..."
                    ></textarea>
                  </div>
                </div>

                {/* Summary & Checkout */}
                <div>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 sticky top-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Sifarişin xülasəsi</h3>
                    
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Xidmət:</dt>
                        <dd className="font-medium text-gray-900">{currentService?.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Universitet:</dt>
                        <dd className="font-medium text-gray-900 truncate max-w-[200px]" title={universities.find(u => u.id === selectedUniversity)?.name}>
                          {universities.find(u => u.id === selectedUniversity)?.short_name}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Çatdırılma (təxmi):</dt>
                        <dd className="font-medium text-gray-900">~15 dəqiqə</dd>
                      </div>
                      <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center">
                        <dt className="text-base font-bold text-gray-900">Yekun məbləğ:</dt>
                        <dd className="text-xl font-extrabold text-primary-600">{currentService?.price} AZN</dd>
                      </div>
                    </dl>

                    <div className="mt-6">
                      <button 
                        type="submit" 
                        disabled={submitting || !topic || !studentName}
                        className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            İşlənir...
                          </span>
                        ) : (
                          'Ödəniş et və Sifarişi tamamla'
                        )}
                      </button>
                      <p className="mt-3 text-xs text-center text-gray-500">
                        Ödəniş təhlükəsiz şəkildə həyata keçirilir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-start pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary" disabled={submitting}>
                  &larr; Geri
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
