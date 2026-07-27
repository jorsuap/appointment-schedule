import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'conAlma — Bienestar psicológico y emocional en Colombia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #3C1955 0%, #5B2D8C 50%, #D2AAF0 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '20px',
          }}
        >
          conAlma
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#FAF5FA',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: '1.4',
          }}
        >
          Tu refugio seguro para el bienestar psicológico y emocional
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: '20px',
            color: '#D2AAF0',
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          Psicología online · Agenda tu cita · Colombia
        </div>

        {/* CTA pill */}
        <div
          style={{
            marginTop: '40px',
            background: '#FFE169',
            color: '#3C1955',
            padding: '14px 36px',
            borderRadius: '40px',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          Agendar mi primera cita →
        </div>
      </div>
    ),
    { ...size }
  );
}
