import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/appointments — Create a new appointment (with patient data)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Patient data
      fullName,
      preferredName,
      dateOfBirth,
      email,
      country,
      isAdult,
      dataPrivacyConsent,
      commsConsent,
      // Evaluation
      reasonForVisit,
      recentFeelings,
      selfHarmRisk,
      currentTreatment,
      previousDiagnosis,
      desiredOutcome,
      additionalNotes,
      informedConsent,
      // Emergency
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      emergencyCountry,
      // Appointment
      professionalId,
      serviceId,
      date,
      startTime,
    } = body;

    // Validate required fields
    if (!fullName || !email || !professionalId || !serviceId || !date || !startTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get service for duration and price
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + service.durationMin;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Check slot is still available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        professionalId,
        date: new Date(date),
        startTime,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
    });

    if (existingAppointment) {
      return NextResponse.json({ error: 'Time slot is no longer available' }, { status: 409 });
    }

    // Create patient and appointment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Upsert patient by email — avoids duplicates when same patient books again
      const patient = await tx.patient.upsert({
        where: { email },
        update: {
          fullName,
          preferredName,
          country,
          isAdult: isAdult === 'si',
          reasonForVisit,
          recentFeelings,
          selfHarmRisk: selfHarmRisk === 'si',
          currentTreatment: currentTreatment === 'si',
          previousDiagnosis,
          desiredOutcome,
          additionalNotes,
          emergencyName,
          emergencyRelation,
          emergencyPhone,
          emergencyCountry,
        },
        create: {
          fullName,
          preferredName,
          dateOfBirth: new Date(dateOfBirth),
          email,
          country,
          isAdult: isAdult === 'si',
          dataPrivacyConsent,
          commsConsent,
          reasonForVisit,
          recentFeelings,
          selfHarmRisk: selfHarmRisk === 'si',
          currentTreatment: currentTreatment === 'si',
          previousDiagnosis,
          desiredOutcome,
          additionalNotes,
          informedConsent,
          emergencyName,
          emergencyRelation,
          emergencyPhone,
          emergencyCountry,
        },
      });

      // Create appointment with 15 min reservation
      const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);

      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          professionalId,
          serviceId,
          date: new Date(date),
          startTime,
          endTime,
          status: 'PENDING_PAYMENT',
          reservedUntil,
        },
        include: {
          professional: true,
          service: true,
        },
      });

      return { patient, appointment };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/appointments — List appointments (admin, with filters)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get('professionalId');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(professionalId && { professionalId }),
      ...(status && { status: status as 'CONFIRMED' | 'PENDING_PAYMENT' | 'COMPLETED' | 'CANCELLED' }),
      ...(from && to && {
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      }),
    },
    include: {
      patient: true,
      professional: true,
      service: true,
      payment: true,
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json(appointments);
}
