import { NextResponse } from 'next/server';

import { decrypt } from '@/lib/encryption';
import { getProfessionalSession } from '@/lib/get-professional-session';
import { revokeToken } from '@/lib/google-oauth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const { error, professionalId } = await getProfessionalSession();

  if (error) {
    return error;
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { googleRefreshToken: true },
  });

  if (!professional?.googleRefreshToken) {
    return NextResponse.json(
      { error: 'Google Calendar is already disconnected' },
      { status: 400 },
    );
  }

  // Decrypt and attempt to revoke the token at Google
  const refreshToken = decrypt(professional.googleRefreshToken);

  try {
    await revokeToken(refreshToken);
  } catch (revokeError) {
    // Don't fail if Google revocation fails (token may already be invalid)
    console.warn(
      '[google-calendar/disconnect] Token revocation failed:',
      revokeError,
    );
  }

  // Clear OAuth fields regardless of revocation result
  await prisma.professional.update({
    where: { id: professionalId },
    data: {
      googleRefreshToken: null,
      googleEmail: null,
      googleCalendarConnected: false,
      googleTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
