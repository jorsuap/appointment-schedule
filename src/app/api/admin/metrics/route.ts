import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/metrics
 * Returns real metrics: sessions, revenue, commission, payout.
 * Filters: startDate, endDate, professionalId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const professionalId = searchParams.get('professionalId');

    // Default to current month
    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam
      ? new Date(new Date(endDateParam).setHours(23, 59, 59, 999))
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Build where clause
    const where: Record<string, unknown> = {
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      date: { gte: startDate, lte: endDate },
    };

    if (professionalId) {
      where.professionalId = professionalId;
    }

    // Fetch appointments with tariff data
    const [appointments, tariffs] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { fullName: true } },
          professional: { select: { id: true, name: true } },
          service: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.professionalTariff.findMany(),
    ]);

    // Build tariff lookup: professionalId-serviceId → { price, commission }
    const tariffMap = new Map<string, { price: number; commission: number }>();
    for (const t of tariffs) {
      tariffMap.set(`${t.professionalId}-${t.serviceId}`, {
        price: t.price,
        commission: t.commission,
      });
    }

    // Calculate metrics
    let totalRevenue = 0;
    let totalCommission = 0;

    const sessions = appointments.map((appt) => {
      const tariff = tariffMap.get(`${appt.professional.id}-${appt.serviceId}`);
      const amount = tariff?.price ?? 0;
      const commissionRate = tariff?.commission ?? 0;
      const commission = Math.round((amount * commissionRate) / 100);
      const payout = amount - commission;

      totalRevenue += amount;
      totalCommission += commission;

      return {
        id: appt.id,
        patient: appt.patient.fullName,
        professional: appt.professional.name,
        professionalId: appt.professional.id,
        date: appt.date.toISOString(),
        service: appt.service.name,
        amount,
        commission,
        payout,
      };
    });

    const totalPayout = totalRevenue - totalCommission;

    return NextResponse.json({
      totalSessions: sessions.length,
      totalRevenue,
      totalCommission,
      totalPayout,
      sessions,
    });
  } catch (err) {
    console.error('Admin metrics error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
