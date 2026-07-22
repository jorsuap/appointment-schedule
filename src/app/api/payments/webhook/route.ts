import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransactionStatus } from '@/lib/wompi';
import { sendAppointmentConfirmation } from '@/lib/emails/send-confirmation';
import { decrypt } from '@/lib/encryption';
import {
  refreshAccessToken,
  createCalendarEvent as createCalendarEventOAuth,
} from '@/lib/google-oauth';

// POST /api/payments/webhook — Receive Wompi payment events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Wompi webhook payload structure
    const { event, data } = body;

    if (event !== 'transaction.updated') {
      return NextResponse.json({ received: true });
    }

    const transaction = data?.transaction;
    if (!transaction) {
      return NextResponse.json({ error: 'No transaction data' }, { status: 400 });
    }

    const reference = transaction.reference;
    const status = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

    // Find payment by reference
    const payment = await prisma.payment.findUnique({
      where: { wompiReference: reference },
      include: {
        appointment: {
          include: { patient: true, professional: true, service: true },
        },
      },
    });

    if (!payment) {
      console.warn(`[Webhook] Payment not found for reference: ${reference}`);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify transaction with Wompi API (double check)
    let verifiedStatus = status;
    try {
      const verified = await getTransactionStatus(transaction.id);
      verifiedStatus = verified.data.status;
    } catch (err) {
      console.warn('[Webhook] Could not verify with Wompi API, using webhook status');
    }

    // Map Wompi status to our status
    const statusMap: Record<string, 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'> = {
      APPROVED: 'APPROVED',
      DECLINED: 'DECLINED',
      VOIDED: 'VOIDED',
      ERROR: 'ERROR',
    };

    const newPaymentStatus = statusMap[verifiedStatus] || 'ERROR';

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newPaymentStatus,
        method: transaction.payment_method_type || null,
        rawResponse: transaction,
      },
    });

    // If approved, confirm the appointment
    if (newPaymentStatus === 'APPROVED') {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'CONFIRMED' },
      });

      const appointment = payment.appointment;
      const professional = appointment.professional;

      // Create Google Calendar event + Meet link (fire-and-forget, Req 6.6)
      try {
        const dateStr2 = appointment.date.toISOString().split('T')[0];
        const startDateTime = `${dateStr2}T${appointment.startTime}:00`;
        const endDateTime = `${dateStr2}T${appointment.endTime}:00`;

        const eventSummary = `conAlma — ${appointment.service.name}`;
        const eventDescription = `Sesión con ${appointment.patient.preferredName || appointment.patient.fullName}.\nDuración: ${appointment.service.durationMin} min`;

        if (professional.googleCalendarConnected && professional.googleRefreshToken) {
          // ─── OAuth flow: use professional's own Google Calendar (Req 6.1, 6.3) ───
          const decryptedRefreshToken = decrypt(professional.googleRefreshToken);
          const { accessToken } = await refreshAccessToken(decryptedRefreshToken);

          const result = await createCalendarEventOAuth({
            accessToken,
            summary: eventSummary,
            description: eventDescription,
            startDateTime,
            endDateTime,
            attendeeEmail: appointment.patient.email,
          });

          if (result) {
            await prisma.appointment.update({
              where: { id: payment.appointmentId },
              data: { googleEventId: result.eventId, meetLink: result.meetLink },
            });
            console.log(
              `[Webhook] Calendar event created via OAuth for appointment ${payment.appointmentId}`,
            );
          } else {
            console.warn(
              `[Webhook] OAuth calendar event returned null for appointment ${payment.appointmentId}`,
            );
          }
        } else if (professional.calendarId) {
          // ─── Fallback: Service Account flow (legacy, when no OAuth connected) ───
          const { createCalendarEvent } = await import('@/lib/google-calendar');
          const { eventId, meetLink } = await createCalendarEvent({
            calendarId: professional.calendarId,
            summary: eventSummary,
            description: eventDescription,
            startDateTime,
            endDateTime,
            attendeeEmail: appointment.patient.email,
          });

          if (eventId || meetLink) {
            await prisma.appointment.update({
              where: { id: payment.appointmentId },
              data: { googleEventId: eventId, meetLink },
            });
          }
        }
        // If neither OAuth nor calendarId configured: no event created (Req 6.7)
      } catch (calErr) {
        console.error('[Webhook] Calendar event creation failed:', calErr);
        // Don't block — appointment is still confirmed (Req 6.6)
      }

      // Re-fetch appointment to get meetLink
      const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: payment.appointmentId },
      });

      // Send confirmation email (async, don't block webhook response)
      const dateStr = appointment.date.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      sendAppointmentConfirmation({
        to: appointment.patient.email,
        patientName: appointment.patient.preferredName || appointment.patient.fullName,
        professionalName: appointment.professional.name,
        serviceName: appointment.service.name,
        date: dateStr,
        time: appointment.startTime,
        duration: appointment.service.durationMin,
        meetLink: updatedAppointment?.meetLink || null,
      }).catch((err) => console.error('[Webhook] Email send failed:', err));

      console.log(`[Webhook] Appointment ${payment.appointmentId} confirmed, email queued`);
    } else {
      console.log(`[Webhook] Payment ${reference} status: ${newPaymentStatus}`);
    }

    return NextResponse.json({ received: true, status: newPaymentStatus });
  } catch (error) {
    console.error('[Webhook] Error processing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
