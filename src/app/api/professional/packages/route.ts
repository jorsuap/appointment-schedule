import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { calculatePackagePrice, DiscountTier } from '@/lib/packages/discount-engine';
import { createWompiPaymentLink } from '@/lib/packages/payment-link-generator';
import { calculateSessionDates, Frequency } from '@/lib/packages/session-scheduler';
import { prisma } from '@/lib/prisma';
import { createPackageSchema } from '@/lib/validations/packages';

/**
 * Adds minutes to a HH:mm time string and returns the result in HH:mm format.
 */
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * GET /api/professional/packages
 * Lists SessionPackage for the authenticated professional.
 * Query params: search (filters by patient name)
 * Includes: patient.fullName, professional.name
 * Ordered by createdAt DESC.
 */
export async function GET(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { professionalId };

    if (search) {
      where.patient = {
        fullName: { contains: search, mode: 'insensitive' },
      };
    }

    const packages = await prisma.sessionPackage.findMany({
      where,
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        professional: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(packages);
  } catch (err) {
    console.error('[professional/packages] GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * POST /api/professional/packages
 * Full package creation flow:
 * 1. Validate body with createPackageSchema
 * 2. Verify patient eligibility
 * 3. Get ProfessionalTariff for price
 * 4. Query active DiscountTiers and calculate price
 * 5. Calculate endTime from startTime + service duration
 * 6. Calculate session dates
 * 7. Create SessionPackage in DB (PENDING_PAYMENT)
 * 8. Handle payment method (wompi or bank_transfer)
 * 9. Return created package + payment info
 */
export async function POST(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createPackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { patientId, serviceId, sessionCount, frequency, startDate, startTime, paymentMethod } =
      parsed.data;

    // Extract per-session time overrides (not validated by Zod, optional)
    const sessionTimeOverrides: Record<string, string> = body.sessionTimeOverrides || {};

    // 2. Verify patient eligibility (has appointment OR was created by this professional)
    const eligiblePatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        OR: [
          { appointments: { some: { professionalId, status: { in: ['CONFIRMED', 'COMPLETED'] } } } },
          { createdByProfessionalId: professionalId },
        ],
      },
      select: { id: true },
    });

    if (!eligiblePatient) {
      return NextResponse.json(
        { error: 'PATIENT_NOT_ELIGIBLE' },
        { status: 403 }
      );
    }

    // 3. Get ProfessionalTariff for this professional + serviceId
    const tariff = await prisma.professionalTariff.findFirst({
      where: { professionalId, serviceId },
    });

    if (!tariff) {
      return NextResponse.json(
        { error: 'TARIFF_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Query active DiscountTiers and calculate price
    const dbTiers = await prisma.discountTier.findMany({
      where: { isActive: true },
    });

    const tiers: DiscountTier[] = dbTiers.map((tier) => ({
      minSessions: tier.minSessions,
      maxSessions: tier.maxSessions,
      discountPerSession: tier.discountPerSession,
    }));

    const priceResult = calculatePackagePrice(tariff.price, sessionCount, tiers);

    // 5. Calculate endTime from startTime + service duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const endTime = addMinutesToTime(startTime, service.durationMin);

    // 6. Calculate session dates
    const frequencyMap: Record<string, Frequency> = {
      weekly: 'weekly',
      biweekly: 'biweekly',
      monthly: 'monthly',
    };

    const sessions = calculateSessionDates(
      new Date(startDate),
      startTime,
      endTime,
      sessionCount,
      frequencyMap[frequency]
    );

    // 7. Create SessionPackage in DB with status PENDING_PAYMENT
    const sessionPackage = await prisma.sessionPackage.create({
      data: {
        professionalId,
        patientId,
        serviceId,
        sessionCount,
        frequency: frequency.toUpperCase() as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
        startDate: new Date(startDate + 'T12:00:00'),
        startTime,
        endTime,
        pricePerSession: tariff.price,
        discountPerSession: priceResult.discountPerSession,
        totalPrice: priceResult.totalPrice,
        paymentMethod: paymentMethod === 'wompi' ? 'WOMPI' : 'BANK_TRANSFER',
        status: 'PENDING_PAYMENT',
        sessionTimeOverrides: Object.keys(sessionTimeOverrides).length > 0 ? sessionTimeOverrides : undefined,
      },
      include: {
        patient: {
          select: { id: true, fullName: true, email: true },
        },
        professional: {
          select: { id: true, name: true },
        },
      },
    });

    // 8. Handle payment method
    if (paymentMethod === 'wompi') {
      // Generate Wompi Payment Link
      const paymentLink = await createWompiPaymentLink({
        packageId: sessionPackage.id,
        amountInCents: priceResult.totalPrice * 100,
        customerName: sessionPackage.patient.fullName,
        customerEmail: sessionPackage.patient.email,
        description: `Paquete ${sessionCount} sesiones - ${sessionPackage.professional.name}`,
      });

      // Save payment link info + wompiReference in the package
      const updatedPackage = await prisma.sessionPackage.update({
        where: { id: sessionPackage.id },
        data: {
          wompiPaymentLinkId: paymentLink.linkId,
          wompiPaymentLinkUrl: paymentLink.linkUrl,
          wompiReference: `PKG-${sessionPackage.id}`,
        },
        include: {
          patient: {
            select: { id: true, fullName: true, email: true },
          },
          professional: {
            select: { id: true, name: true },
          },
        },
      });

      return NextResponse.json({
        package: updatedPackage,
        sessions,
        paymentLink: {
          linkId: paymentLink.linkId,
          linkUrl: paymentLink.linkUrl,
        },
      }, { status: 201 });
    }

    // paymentMethod === 'bank_transfer'
    const bankDetails = await prisma.bankDetails.findMany({
      where: { isActive: true },
    });

    return NextResponse.json({
      package: sessionPackage,
      sessions,
      bankDetails,
    }, { status: 201 });
  } catch (err) {
    console.error('[professional/packages] POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
