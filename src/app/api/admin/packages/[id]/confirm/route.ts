import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

/**
 * POST /api/admin/packages/[id]/confirm
 * Confirms a bank transfer payment for a SessionPackage.
 * Verifies that the package exists and is in PENDING_PAYMENT status.
 * Updates status to CONFIRMED.
 * Requires admin session.
 *
 * NOTE: When package-confirmer.ts is implemented (task 5.1),
 * this route will delegate to confirmPackage(id) which also creates appointments.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;

    const pkg = await prisma.sessionPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    if (pkg.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Package must be in PENDING_PAYMENT status to confirm' },
        { status: 409 },
      );
    }

    const updated = await prisma.sessionPackage.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[admin/packages/[id]/confirm] POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
