import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

/**
 * GET /api/admin/packages
 * Returns all SessionPackage records with optional filters.
 * Query params: status, professionalId, patientId
 * Includes: professional.name, patient.fullName
 * Ordered by createdAt DESC.
 * Requires admin session.
 */
export async function GET(request: NextRequest) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const professionalId = searchParams.get('professionalId');
    const patientId = searchParams.get('patientId');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (professionalId) {
      where.professionalId = professionalId;
    }
    if (patientId) {
      where.patientId = patientId;
    }

    const packages = await prisma.sessionPackage.findMany({
      where,
      include: {
        professional: {
          select: { id: true, name: true },
        },
        patient: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(packages);
  } catch (err) {
    console.error('[admin/packages] GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
