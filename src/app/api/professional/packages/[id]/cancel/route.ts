import { NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/professional/packages/[id]/cancel
 * Cancels a package that is in PENDING_PAYMENT status.
 * Verifies the package exists and belongs to the authenticated professional.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const { id } = await params;

    const sessionPackage = await prisma.sessionPackage.findUnique({
      where: { id },
    });

    if (!sessionPackage) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    if (sessionPackage.professionalId !== professionalId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    if (sessionPackage.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Only packages with PENDING_PAYMENT status can be cancelled' },
        { status: 409 }
      );
    }

    const updatedPackage = await prisma.sessionPackage.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        patient: {
          select: { id: true, fullName: true, email: true },
        },
        professional: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (err) {
    console.error('[professional/packages/[id]/cancel] POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
