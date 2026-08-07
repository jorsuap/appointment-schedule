import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

/**
 * POST /api/admin/packages/[id]/reject
 * Rejects a pending payment for a SessionPackage.
 * Verifies that the package exists and is in PENDING_PAYMENT status.
 * Updates status to CANCELLED.
 * Requires admin session.
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
        { error: 'INVALID_STATUS', message: 'Package must be in PENDING_PAYMENT status to reject' },
        { status: 409 },
      );
    }

    const updated = await prisma.sessionPackage.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[admin/packages/[id]/reject] POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
