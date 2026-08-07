import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { calculatePackagePrice, DiscountTier } from '@/lib/packages/discount-engine';
import { prisma } from '@/lib/prisma';
import { calculatePriceSchema } from '@/lib/validations/packages';

export async function POST(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const body = await request.json();
    const parsed = calculatePriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { sessionCount, serviceId } = parsed.data;

    // Get the professional's tariff for the selected service
    const tariff = await prisma.professionalTariff.findFirst({
      where: { professionalId, serviceId },
    });

    if (!tariff) {
      return NextResponse.json(
        { error: 'TARIFF_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get active discount tiers
    const dbTiers = await prisma.discountTier.findMany({
      where: { isActive: true },
    });

    // Map DB tiers to the DiscountTier interface expected by the engine
    const tiers: DiscountTier[] = dbTiers.map((tier) => ({
      minSessions: tier.minSessions,
      maxSessions: tier.maxSessions,
      discountPerSession: tier.discountPerSession,
    }));

    const result = calculatePackagePrice(tariff.price, sessionCount, tiers);

    return NextResponse.json({
      pricePerSession: tariff.price,
      discountPerSession: result.discountPerSession,
      totalPrice: result.totalPrice,
      totalDiscount: result.totalDiscount,
      sessionCount,
    });
  } catch (err) {
    console.error('Package calculate POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
