import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const { id: patientId } = await params;

    // Verify this patient has at least one appointment with the current professional
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        professionalId,
      },
      select: { id: true },
    });

    if (!hasAppointment) {
      return NextResponse.json(
        { error: 'PATIENT_NOT_YOURS' },
        { status: 403 }
      );
    }

    // Fetch full patient record
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'PATIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch appointments with this professional
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        professionalId,
      },
      include: {
        service: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Fetch progress notes authored by this professional
    const progressNotes = await prisma.progressNote.findMany({
      where: {
        patientId,
        authorId: professionalId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        preferredName: patient.preferredName,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth.toISOString(),
        country: patient.country,
        isAdult: patient.isAdult,
        reasonForVisit: patient.reasonForVisit,
        recentFeelings: patient.recentFeelings,
        selfHarmRisk: patient.selfHarmRisk,
        currentTreatment: patient.currentTreatment,
        previousDiagnosis: patient.previousDiagnosis,
        desiredOutcome: patient.desiredOutcome,
        additionalNotes: patient.additionalNotes,
        informedConsent: patient.informedConsent,
        emergencyName: patient.emergencyName,
        emergencyRelation: patient.emergencyRelation,
        emergencyPhone: patient.emergencyPhone,
        emergencyCountry: patient.emergencyCountry,
        dataPrivacyConsent: patient.dataPrivacyConsent,
        commsConsent: patient.commsConsent,
        createdAt: patient.createdAt.toISOString(),
        updatedAt: patient.updatedAt.toISOString(),
      },
      appointments: appointments.map((appt) => ({
        id: appt.id,
        patientName: patient.fullName,
        serviceName: appt.service.name,
        date: appt.date.toISOString(),
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        meetLink: appt.meetLink,
      })),
      progressNotes: progressNotes.map((note) => ({
        id: note.id,
        content: note.content,
        appointmentId: note.appointmentId,
        createdAt: note.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Patient detail GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
