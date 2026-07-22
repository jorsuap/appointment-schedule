import { NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    const [todayAppointments, upcomingAppointments, monthlyAppointments, tariffs] =
      await Promise.all([
        // Today's appointments: CONFIRMED or COMPLETED
        prisma.appointment.findMany({
          where: {
            professionalId,
            date: { gte: startOfToday, lte: endOfToday },
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
          include: {
            patient: { select: { fullName: true } },
            service: { select: { name: true } },
          },
          orderBy: { startTime: 'asc' },
        }),

        // Upcoming appointments: future, CONFIRMED, max 5, ASC
        prisma.appointment.findMany({
          where: {
            professionalId,
            date: { gt: now },
            status: 'CONFIRMED',
          },
          include: {
            patient: { select: { fullName: true } },
            service: { select: { name: true } },
          },
          orderBy: { date: 'asc' },
          take: 5,
        }),

        // Monthly appointments for income: CONFIRMED or COMPLETED within current month
        prisma.appointment.findMany({
          where: {
            professionalId,
            date: { gte: startOfMonth, lte: endOfMonth },
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
          select: { serviceId: true },
        }),

        // Professional's tariffs for income calculation
        prisma.professionalTariff.findMany({
          where: { professionalId },
        }),
      ]);

    // Build tariff lookup by serviceId
    const tariffMap = new Map<string, { price: number; commission: number }>(
      tariffs.map((t) => [t.serviceId, { price: t.price, commission: t.commission }]),
    );

    // Calculate monthly income
    let totalBilled = 0;
    let commission = 0;

    for (const appointment of monthlyAppointments) {
      const tariff = tariffMap.get(appointment.serviceId);
      if (tariff) {
        totalBilled += tariff.price;
        commission += Math.round((tariff.price * tariff.commission) / 100);
      }
    }

    const netIncome = totalBilled - commission;

    // Map appointments to summary format
    const mapToSummary = (
      appt: (typeof todayAppointments)[number],
    ) => ({
      id: appt.id,
      patientName: appt.patient.fullName,
      serviceName: appt.service.name,
      date: appt.date.toISOString(),
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      meetLink: appt.meetLink,
    });

    return NextResponse.json({
      todayAppointments: todayAppointments.map(mapToSummary),
      upcomingAppointments: upcomingAppointments.map(mapToSummary),
      monthlyIncome: {
        totalBilled,
        commission,
        netIncome,
      },
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
