import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google-calendar';

// POST /api/calendar/create-event — Create Google Calendar event + Meet link for an appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, professional: true, service: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Appointment must be confirmed' }, { status: 400 });
    }

    // Professional must have a calendarId configured
    const calendarId = appointment.professional.calendarId || appointment.professional.email;

    // Build event date/time
    const dateStr = appointment.date.toISOString().split('T')[0];
    const startDateTime = `${dateStr}T${appointment.startTime}:00`;
    const endDateTime = `${dateStr}T${appointment.endTime}:00`;

    const { eventId, meetLink } = await createCalendarEvent({
      calendarId,
      summary: `conAlma — ${appointment.service.name}`,
      description: `Sesión de ${appointment.service.name} con ${appointment.patient.preferredName || appointment.patient.fullName}.\n\nDuración: ${appointment.service.durationMin} min\nPaciente: ${appointment.patient.fullName}\nEmail: ${appointment.patient.email}`,
      startDateTime,
      endDateTime,
      attendeeEmail: appointment.patient.email,
    });

    // Update appointment with calendar event ID and Meet link
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        googleEventId: eventId,
        meetLink,
      },
    });

    return NextResponse.json({ eventId, meetLink });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}
