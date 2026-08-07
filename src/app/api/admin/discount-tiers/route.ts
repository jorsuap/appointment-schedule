import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { discountTierSchema } from '@/lib/validations/packages';
import type { Session } from 'next-auth';

/**
 * GET /api/admin/discount-tiers
 * Returns all DiscountTier records ordered by minSessions ASC.
 * Requires admin session.
 */
export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const tiers = await prisma.discountTier.findMany({
      orderBy: { minSessions: 'asc' },
    });

    return NextResponse.json(tiers);
  } catch (err) {
    console.error('[admin/discount-tiers] GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * POST /api/admin/discount-tiers
 * Creates a new DiscountTier. Validates body with discountTierSchema.
 * Requires admin session.
 */
export async function POST(request: Request) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = discountTierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const tier = await prisma.discountTier.create({
      data: parsed.data,
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (err) {
    console.error('[admin/discount-tiers] POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
