import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { discountTierSchema } from '@/lib/validations/packages';
import type { Session } from 'next-auth';

/**
 * PUT /api/admin/discount-tiers/[id]
 * Updates an existing DiscountTier by ID. Validates body with discountTierSchema.
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
    const parsed = discountTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const tier = await prisma.discountTier.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(tier);
  } catch (err) {
    console.error('[admin/discount-tiers/[id]] PUT error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/discount-tiers/[id]
 * Deletes a DiscountTier by ID.
 * Requires admin session.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.discountTier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/discount-tiers/[id]] DELETE error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
