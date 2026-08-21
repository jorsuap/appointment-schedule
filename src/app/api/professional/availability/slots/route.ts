import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/professional/availability/slots?serviceId=xxx
 * Returns available time slots for the authenticated professional for the next 60 days.
 * Same logic as the public /api/availability but uses session for professionalId.
 */
export async function GET(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('serviceId');

  if (!serviceId) {
    return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
  }

  try {
    // Get service duration
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get professional's weekly schedule
    const availabilities = await prisma.availability.findMany({
      where: { professionalId, isActive: true },
    });

    // Get blocked dates
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        professionalId,
        date: { gte: now, lte: sixtyDaysFromNow },
      },
    });

    const blockedDateStrings = blockedDates.map(
      (b) => b.date.toISOString().split('T')[0],
    );

    // Get existing confirmed/pending appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        date: { gte: now, lte: sixtyDaysFromNow },
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
    });

    // Generate available slots for next 60 days
    const slots: Record<string, string[]> = {};
    const slotDuration = service.durationMin;

    for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
      const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Skip blocked dates
      if (blockedDateStrings.includes(dateStr)) continue;

      // Find schedule for this day of week
      const daySchedules = availabilities.filter((a) => a.dayOfWeek === dayOfWeek);
      if (daySchedules.length === 0) continue;

      const daySlots: string[] = [];

      for (const schedule of daySchedules) {
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Generate slots based on service duration
        for (let t = startMinutes; t + slotDuration <= endMinutes; t += slotDuration) {
          const hour = Math.floor(t / 60).toString().padStart(2, '0');
          const min = (t % 60).toString().padStart(2, '0');
          const timeStr = `${hour}:${min}`;

          // Check if slot is already booked
          const isBooked = existingAppointments.some(
            (a) => a.date.toISOString().split('T')[0] === dateStr && a.startTime === timeStr,
          );

          if (!isBooked) {
            daySlots.push(timeStr);
          }
        }
      }

      if (daySlots.length > 0) {
        slots[dateStr] = daySlots.sort();
      }
    }

    return NextResponse.json({
      professionalId,
      serviceId,
      serviceDuration: slotDuration,
      slots,
    });
  } catch (err) {
    console.error('Professional availability slots GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
