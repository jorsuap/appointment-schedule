import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

type ProfessionalSessionSuccess = {
  error: null;
  session: NonNullable<Awaited<ReturnType<typeof auth>>>;
  professionalId: string;
};

type ProfessionalSessionError = {
  error: NextResponse;
  session: null;
  professionalId: null;
};

type ProfessionalSessionResult = ProfessionalSessionSuccess | ProfessionalSessionError;

export async function getProfessionalSession(): Promise<ProfessionalSessionResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }),
      session: null,
      professionalId: null,
    };
  }

  if (session.user.role !== 'PROFESSIONAL' || !session.user.professionalId) {
    return {
      error: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }),
      session: null,
      professionalId: null,
    };
  }

  return {
    error: null,
    session,
    professionalId: session.user.professionalId,
  };
}
