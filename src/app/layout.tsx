import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'conAlma — Bienestar psicológico y emocional',
  description:
    'Agenda tu cita de psicología y talleres de bienestar emocional. Un refugio seguro para tu salud mental.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
