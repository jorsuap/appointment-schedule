import { NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/professional/packages/[id]
 * Returns a SessionPackage detail with patient, professional, and scheduled appointments.
 * Verifies the package belongs to the authenticated professional.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const { id } = await params;

    const sessionPackage = await prisma.sessionPackage.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, fullName: true, email: true },
        },
        professional: {
          select: { id: true, name: true },
        },
        appointments: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            status: true,
            meetLink: true,
            googleEventId: true,
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!sessionPackage) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    if (sessionPackage.professionalId !== professionalId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    return NextResponse.json(sessionPackage);
  } catch (err) {
    console.error('[professional/packages/[id]] GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
