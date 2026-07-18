import { NextRequest, NextResponse } from 'next/server';
import { resend, FROM_EMAIL } from '@/lib/resend';

export const dynamic = 'force-dynamic';

// POST /api/test/email — Send a test email (dev/admin only)
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const body = await request.json();
  const { to } = body;

  if (!to) {
    return NextResponse.json({ error: 'Email "to" is required' }, { status: 400 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Test — conAlma Email Service',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #3C1955;">conAlma — Test Email</h2>
          <p>Si estás leyendo esto, el servicio de email está funcionando correctamente. ✅</p>
          <p style="color: #6B4D7A; font-size: 12px;">Enviado desde el entorno de desarrollo.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
