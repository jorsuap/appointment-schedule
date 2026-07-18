import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPaymentSession } from '@/lib/wompi';

// POST /api/payments/create — Generate payment session for an appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, payerName, payerEmail } = body;

    if (!appointmentId || !payerName || !payerEmail) {
      return NextResponse.json({ error: 'appointmentId, payerName, and payerEmail are required' }, { status: 400 });
    }

    // Get appointment with service info
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, professional: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: 'Appointment is not pending payment' }, { status: 400 });
    }

    // Check reservation hasn't expired
    if (appointment.reservedUntil && new Date() > appointment.reservedUntil) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Reservation expired. Please select a new time slot.' }, { status: 410 });
    }

    // Get price from professional tariff or service default
    const tariff = await prisma.professionalTariff.findUnique({
      where: {
        professionalId_serviceId: {
          professionalId: appointment.professionalId,
          serviceId: appointment.serviceId,
        },
      },
    });

    const price = tariff?.price || appointment.service.price;
    const amountInCents = price * 100; // Wompi uses cents

    // Create reference
    const reference = `conalma-${appointmentId}-${Date.now()}`;

    // Create payment record
    await prisma.payment.create({
      data: {
        appointmentId,
        amount: price,
        status: 'PENDING',
        payerName,
        payerEmail,
        wompiReference: reference,
      },
    });

    // Generate Wompi session data
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createPaymentSession({
      reference,
      amountInCents,
      customerEmail: payerEmail,
      customerName: payerName,
      redirectUrl: `${appUrl}/agendar/confirmacion?ref=${reference}`,
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
