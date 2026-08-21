import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

/** Format Date to YYYY-MM-DD using UTC (dates in DB are stored at midnight UTC) */
function toDateStr(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Get day of week from a YYYY-MM-DD string (0=Sunday) */
function getDayOfWeekFromStr(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

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
      (b) => toDateStr(b.date),
    );

    // Get existing confirmed/pending appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        date: { gte: now, lte: sixtyDaysFromNow },
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
    });

    // Build a map of booked slots: "YYYY-MM-DD" -> Set<"HH:MM">
    const bookedMap = new Map<string, Set<string>>();
    for (const appt of existingAppointments) {
      const key = toDateStr(appt.date);
      if (!bookedMap.has(key)) bookedMap.set(key, new Set());
      bookedMap.get(key)!.add(appt.startTime);
    }

    // Generate available slots for next 60 days
    const slots: Record<string, string[]> = {};
    const slotDuration = service.durationMin;
    const today = new Date();

    for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
      const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset);
      const dateStr = toDateStr(futureDate);
      const dayOfWeek = getDayOfWeekFromStr(dateStr);

      // Skip blocked dates
      if (blockedDateStrings.includes(dateStr)) continue;

      // Find schedule for this day of week
      const daySchedules = availabilities.filter((a) => a.dayOfWeek === dayOfWeek);
      if (daySchedules.length === 0) continue;

      const daySlots: string[] = [];
      const bookedTimes = bookedMap.get(dateStr);

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
          if (bookedTimes?.has(timeStr)) continue;

          daySlots.push(timeStr);
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
