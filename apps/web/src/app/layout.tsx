import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/providers';
import { Toaster } from '@/components/ui/toaster';
import { ThemeInit } from '@/components/shared/theme-init';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { template: '%s | Dream Life', default: 'Dream Life — Anime Store' },
  description: 'Tu tienda anime favorita en Perú',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplicar tema antes del primer render para evitar parpadeo */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = JSON.parse(localStorage.getItem('dreamlife-theme'));
                var theme = (t && t.state && t.state.theme) || 'dark';
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch(e) { document.documentElement.classList.add('dark'); }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <ThemeInit />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
