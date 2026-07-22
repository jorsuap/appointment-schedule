import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const month = request.nextUrl.searchParams.get('month'); // YYYY-MM

    let dateFilter: { gte?: Date; lte?: Date } = {};

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);
      dateFilter = { gte: startOfMonth, lte: endOfMonth };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        service: { select: { name: true, durationMin: true } },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({
      appointments: appointments.map((appt) => ({
        id: appt.id,
        patient: {
          id: appt.patient.id,
          fullName: appt.patient.fullName,
          email: appt.patient.email,
        },
        service: {
          name: appt.service.name,
          durationMin: appt.service.durationMin,
        },
        date: appt.date.toISOString(),
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        meetLink: appt.meetLink,
        googleEventId: appt.googleEventId,
        createdAt: appt.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Appointments GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId || typeof appointmentId !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: { appointmentId: ['Required'] } },
        { status: 422 }
      );
    }

    // Find appointment verifying ownership
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, professionalId },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'APPOINTMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only CONFIRMED → COMPLETED is valid
    if (appointment.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'INVALID_TRANSITION' },
        { status: 422 }
      );
    }

    // Update status to COMPLETED
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, fullName: true, email: true } },
        service: { select: { name: true, durationMin: true } },
      },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({
      id: updated.id,
      patient: {
        id: updated.patient.id,
        fullName: updated.patient.fullName,
        email: updated.patient.email,
      },
      service: {
        name: updated.service.name,
        durationMin: updated.service.durationMin,
      },
      date: updated.date.toISOString(),
      startTime: updated.startTime,
      endTime: updated.endTime,
      status: updated.status,
      meetLink: updated.meetLink,
      googleEventId: updated.googleEventId,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('Appointments PATCH error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
