import { NextRequest, NextResponse } from 'next/server';

import { encrypt } from '@/lib/encryption';
import { exchangeCodeForTokens, verifyState } from '@/lib/google-oauth';
import { prisma } from '@/lib/prisma';

const AVAILABILITY_URL = '/profesional/disponibilidad';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  const baseUrl = request.nextUrl.origin;

  // 1. Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}${AVAILABILITY_URL}?error=missing_params`,
    );
  }

  try {
    // 2. Verify state (HMAC-signed professionalId)
    const professionalId = verifyState(state);

    // 3. Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // 4. Optionally fetch Google userinfo to get email
    let googleEmail: string | null = null;
    try {
      const userinfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        },
      );
      if (userinfoResponse.ok) {
        const userinfo = (await userinfoResponse.json()) as { email?: string };
        googleEmail = userinfo.email ?? null;
      }
    } catch {
      // Non-critical: continue without email
    }

    // 5. Encrypt refresh token with AES-256-GCM
    const encryptedRefreshToken = encrypt(tokens.refreshToken);

    // 6. Update Professional in DB
    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        googleRefreshToken: encryptedRefreshToken,
        googleEmail,
        googleCalendarConnected: true,
        googleTokenExpiresAt: tokens.expiresAt,
      },
    });

    // 7. Redirect to availability page with success
    return NextResponse.redirect(
      `${baseUrl}${AVAILABILITY_URL}?connected=true`,
    );
  } catch {
    // Any error in the flow: redirect with error
    return NextResponse.redirect(
      `${baseUrl}${AVAILABILITY_URL}?error=oauth_failed`,
    );
  }
}
