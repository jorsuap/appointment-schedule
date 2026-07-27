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
  title: {
    default: 'conAlma — Psicología online y bienestar emocional | Colombia',
    template: '%s | conAlma',
  },
  description:
    'Agenda tu cita de psicología online en Colombia. Acompañamiento emocional profesional con sesiones por videollamada. Tu refugio seguro para la salud mental.',
  keywords: [
    'psicología online Colombia',
    'terapia psicológica virtual',
    'psicóloga online',
    'salud mental Colombia',
    'bienestar emocional',
    'acompañamiento psicológico',
    'agendar cita psicólogo',
    'terapia online videollamada',
    'psicología Bogotá',
    'psicología Medellín',
    'psicología Cali',
    'conAlma psicología',
  ],
  authors: [{ name: 'conAlma' }],
  creator: 'conAlma',
  metadataBase: new URL('https://conalma.care'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://conalma.care',
    siteName: 'conAlma',
    title: 'conAlma — Psicología online y bienestar emocional',
    description:
      'Agenda tu cita de psicología online. Acompañamiento emocional profesional con sesiones por videollamada. Tu refugio seguro para la salud mental en Colombia.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'conAlma — Psicología online y bienestar emocional',
    description:
      'Agenda tu cita de psicología online en Colombia. Acompañamiento emocional con profesionales certificados.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here when ready
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'conAlma',
    description: 'Plataforma de psicología online y bienestar emocional en Colombia',
    url: 'https://conalma.care',
    logo: 'https://conalma.care/icon.svg',
    areaServed: {
      '@type': 'Country',
      name: 'Colombia',
    },
    serviceType: 'Psicología online',
    availableLanguage: 'es',
    priceRange: '$$',
    medicalSpecialty: 'Psychiatric',
  };

  return (
    <html lang="es" className={`${montserrat.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
