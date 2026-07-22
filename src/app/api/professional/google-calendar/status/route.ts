import { NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, professionalId } = await getProfessionalSession();

  if (error) {
    return error;
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: {
      googleCalendarConnected: true,
      googleEmail: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!professional) {
    return NextResponse.json({ error: 'PROFESSIONAL_NOT_FOUND' }, { status: 404 });
  }

  const connected = professional.googleCalendarConnected;
  const email = professional.googleEmail ?? null;
  const expiresAt = professional.googleTokenExpiresAt?.toISOString() ?? null;

  const needsReconnect =
    connected && professional.googleTokenExpiresAt
      ? professional.googleTokenExpiresAt < new Date()
      : false;

  return NextResponse.json({
    connected,
    email,
    expiresAt,
    ...(needsReconnect && { needsReconnect: true }),
  });
}
