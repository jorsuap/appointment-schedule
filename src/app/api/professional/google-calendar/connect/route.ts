import { NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { buildGoogleOAuthUrl } from '@/lib/google-oauth';

export async function GET() {
  const { error, professionalId } = await getProfessionalSession();

  if (error) {
    return error;
  }

  const consentUrl = buildGoogleOAuthUrl(professionalId);

  return NextResponse.redirect(consentUrl, 302);
}
