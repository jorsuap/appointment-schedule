import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED']),
});

/**
 * PUT /api/admin/packages/[id]/status
 * Allows admin to change a SessionPackage status to any valid value.
 * Used for error correction (e.g., reverting an accidental confirmation).
 * Body: { status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' }
 * Requires admin session.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const pkg = await prisma.sessionPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const updated = await prisma.sessionPackage.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[admin/packages/[id]/status] PUT error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
