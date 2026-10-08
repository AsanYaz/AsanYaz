import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import NavAuth from '@/components/NavAuth';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'AsanYaz — Akademik işlərin daha asan',
  description: 'AsanYaz ilə akademik sənədlərinizi, sərbəst işlərinizi və diplom işlərinizi asanlıqla yaradın.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className={`${inter.variable} ${outfit.variable} antialiased min-h-screen flex flex-col`}>
        <nav className="header-nav">
          <div className="container nav-content">
            <a href="/" className="logo">Asan<span>Yaz</span></a>
            <div className="nav-links">
              <a href="/services">Xidmətlər</a>
              <a href="/universities">Universitetlər</a>
              <a href="/pricing">Qiymətlər</a>
              <a href="/how-it-works">Necə işləyir?</a>
              <a href="/faq">FAQ</a>
            </div>
            <NavAuth />
          </div>
        </nav>
        
        <main className="flex-grow">
          {children}
        </main>

        <footer className="footer">
          <div className="container footer-content">
            <div className="footer-brand">
              <span className="logo">Asan<span>Yaz</span></span>
              <p>Akademik işlərin daha asan. Bütün hüquqlar qorunur © {new Date().getFullYear()}</p>
            </div>
            <div className="footer-links">
              <div>
                <h4>Məhsul</h4>
                <a href="/services">Xidmətlər</a>
                <a href="/pricing">Qiymətlər</a>
                <a href="/universities">Universitetlər</a>
              </div>
              <div>
                <h4>Kömək</h4>
                <a href="/how-it-works">Necə işləyir?</a>
                <a href="/faq">FAQ</a>
                <a href="/contact">Əlaqə</a>
              </div>
              <div>
                <h4>Hüquqi</h4>
                <a href="/terms">İstifadə şərtləri</a>
                <a href="/privacy">Məxfilik siyasəti</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
