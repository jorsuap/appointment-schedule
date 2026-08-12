import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';
import { createPatientSchema } from '@/lib/validations/patient';

export async function GET(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  const { searchParams } = new URL(request.url);
  const eligible = searchParams.get('eligible');

  // When eligible=packages, filter only patients with CONFIRMED/COMPLETED appointments
  const appointmentStatusFilter =
    eligible === 'packages'
      ? { status: { in: ['CONFIRMED' as const, 'COMPLETED' as const] } }
      : {};

  try {
    // Find patients that have at least one appointment with this professional
    const patients = await prisma.patient.findMany({
      where: {
        appointments: {
          some: {
            professionalId,
            ...appointmentStatusFilter,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        preferredName: true,
        email: true,
        appointments: {
          where: { professionalId, ...appointmentStatusFilter },
          select: { date: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    // Map to response shape with computed fields
    const patientsWithStats = patients
      .map((patient) => ({
        id: patient.id,
        fullName: patient.fullName,
        preferredName: patient.preferredName,
        email: patient.email,
        lastAppointmentDate:
          patient.appointments.length > 0
            ? patient.appointments[0].date.toISOString()
            : null,
        totalAppointments: patient.appointments.length,
      }))
      .sort((a, b) => {
        // Order by lastAppointmentDate DESC (most recent first), nulls last
        if (!a.lastAppointmentDate && !b.lastAppointmentDate) return 0;
        if (!a.lastAppointmentDate) return 1;
        if (!b.lastAppointmentDate) return -1;
        return b.lastAppointmentDate.localeCompare(a.lastAppointmentDate);
      });

    return NextResponse.json({ patients: patientsWithStats });
  } catch (err) {
    console.error('Patients GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const { error, professionalId } = await getProfessionalSession();
  if (error) return error;

  // 2. Parse & validate body
  const body = await request.json();
  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  try {
    // 3. Transaction: upsert patient + conditional appointment
    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.upsert({
        where: { email: data.email },
        create: {
          fullName: data.fullName,
          email: data.email,
          dateOfBirth: new Date(data.dateOfBirth),
          country: data.country,
          isAdult: data.isAdult,
          preferredName: data.preferredName || null,
          reasonForVisit: data.reasonForVisit || null,
          recentFeelings: data.recentFeelings || null,
          selfHarmRisk: data.selfHarmRisk ?? false,
          currentTreatment: data.currentTreatment ?? false,
          previousDiagnosis: data.previousDiagnosis || null,
          desiredOutcome: data.desiredOutcome || null,
          additionalNotes: data.additionalNotes || null,
          emergencyName: data.emergencyName || null,
          emergencyRelation: data.emergencyRelation || null,
          emergencyPhone: data.emergencyPhone || null,
          emergencyCountry: data.emergencyCountry || null,
          dataPrivacyConsent: data.dataPrivacyConsent ?? false,
          commsConsent: data.commsConsent ?? false,
          informedConsent: data.informedConsent ?? false,
        },
        update: {
          fullName: data.fullName,
          dateOfBirth: new Date(data.dateOfBirth),
          country: data.country,
          isAdult: data.isAdult,
          preferredName: data.preferredName || null,
          reasonForVisit: data.reasonForVisit || null,
          recentFeelings: data.recentFeelings || null,
          selfHarmRisk: data.selfHarmRisk ?? false,
          currentTreatment: data.currentTreatment ?? false,
          previousDiagnosis: data.previousDiagnosis || null,
          desiredOutcome: data.desiredOutcome || null,
          additionalNotes: data.additionalNotes || null,
          emergencyName: data.emergencyName || null,
          emergencyRelation: data.emergencyRelation || null,
          emergencyPhone: data.emergencyPhone || null,
          emergencyCountry: data.emergencyCountry || null,
          dataPrivacyConsent: data.dataPrivacyConsent ?? false,
          commsConsent: data.commsConsent ?? false,
          informedConsent: data.informedConsent ?? false,
        },
      });

      // Check existing link (CONFIRMED or COMPLETED appointment with this professional)
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          patientId: patient.id,
          professionalId,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      });

      let appointmentCreated = false;

      if (!existingAppointment) {
        // Get first service from professional's configured services
        const profService = await tx.professionalService.findFirst({
          where: { professionalId },
        });

        if (!profService) {
          throw new Error('NO_SERVICES');
        }

        await tx.appointment.create({
          data: {
            patientId: patient.id,
            professionalId,
            serviceId: profService.serviceId,
            date: new Date(),
            startTime: '00:00',
            endTime: '00:01',
            status: 'CONFIRMED',
          },
        });
        appointmentCreated = true;
      }

      return { patient, appointmentCreated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_SERVICES') {
      return NextResponse.json({ error: 'NO_SERVICES' }, { status: 400 });
    }
    console.error('Patient POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
