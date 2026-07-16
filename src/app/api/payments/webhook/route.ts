import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTransactionStatus } from '@/lib/wompi';
import { sendAppointmentConfirmation } from '@/lib/emails/send-confirmation';

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

      // Send confirmation email (async, don't block webhook response)
      const appointment = payment.appointment;
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
        meetLink: appointment.meetLink,
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
