import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { confirmPackage } from '@/lib/packages/package-confirmer';
import type { Session } from 'next-auth';

/**
 * POST /api/admin/packages/[id]/confirm
 * Confirms a bank transfer payment for a SessionPackage.
 * Delegates to confirmPackage() which creates appointments + calendar events.
 * Only for packages with BANK_TRANSFER method and PENDING_PAYMENT status.
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
        { error: 'INVALID_STATUS', message: 'El paquete debe estar en estado pendiente de pago' },
        { status: 409 },
      );
    }

    // Use confirmPackage to create appointments, calendar events, and send emails
    await confirmPackage(id);

    return NextResponse.json({ success: true, status: 'CONFIRMED' });
  } catch (err) {
    console.error('[admin/packages/[id]/confirm] POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
