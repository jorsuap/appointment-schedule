import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to current month if not provided
    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'INVALID_DATE_RANGE', details: 'Invalid date format. Use ISO date strings.' },
        { status: 422 },
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'INVALID_DATE_RANGE', details: 'startDate must be before or equal to endDate.' },
        { status: 422 },
      );
    }

    // Ensure endDate covers the full day if only date was provided
    const adjustedEndDate = endDateParam
      ? new Date(new Date(endDateParam).setHours(23, 59, 59, 999))
      : endDate;

    // Fetch appointments with status CONFIRMED or COMPLETED within the date range
    const [appointments, tariffs] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          professionalId,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          date: { gte: startDate, lte: adjustedEndDate },
        },
        include: {
          patient: { select: { fullName: true } },
          service: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.professionalTariff.findMany({
        where: { professionalId },
      }),
    ]);

    // Build tariff lookup by serviceId
    const tariffMap = new Map<string, { price: number; commission: number }>(
      tariffs.map((t) => [t.serviceId, { price: t.price, commission: t.commission }]),
    );

    // Calculate income per session
    let totalBilled = 0;
    let totalCommission = 0;

    const sessions = appointments.map((appt) => {
      const tariff = tariffMap.get(appt.serviceId);
      const amount = tariff?.price ?? 0;
      const commissionRate = tariff?.commission ?? 0;
      const commissionAmount = Math.round((amount * commissionRate) / 100);
      const netAmount = amount - commissionAmount;

      totalBilled += amount;
      totalCommission += commissionAmount;

      return {
        appointmentId: appt.id,
        date: appt.date.toISOString(),
        patientName: appt.patient.fullName,
        serviceName: appt.service.name,
        amount,
        commissionRate,
        commissionAmount,
        netAmount,
        status: appt.status as 'CONFIRMED' | 'COMPLETED',
      };
    });

    const netIncome = totalBilled - totalCommission;

    return NextResponse.json({
      summary: {
        totalBilled,
        totalCommission,
        netIncome,
        period: {
          start: startDate.toISOString(),
          end: adjustedEndDate.toISOString(),
        },
      },
      sessions,
    });
  } catch (err) {
    console.error('Income API error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
