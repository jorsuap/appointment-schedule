import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validations/professional-profile';

export async function GET() {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        tariffs: {
          take: 1,
          select: { price: true, commission: true },
        },
      },
    });

    if (!professional) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const tariff = professional.tariffs[0] ?? { price: 0, commission: 0 };

    return NextResponse.json({
      id: professional.id,
      name: professional.name,
      email: professional.email,
      specialty: professional.specialty,
      description: professional.description,
      traits: professional.traits,
      photoUrl: professional.photoUrl,
      tariff: {
        price: tariff.price,
        commission: tariff.commission,
      },
      googleCalendarConnected: professional.googleCalendarConnected,
      googleCalendarEmail: professional.googleEmail,
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const body = await request.json();

    // Validate with Zod — the schema only accepts editable fields
    // (specialty, description, traits, photoUrl), stripping any readonly fields
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const validatedData = result.data;

    // Update only validated (editable) fields
    const updated = await prisma.professional.update({
      where: { id: professionalId },
      data: validatedData,
      include: {
        tariffs: {
          take: 1,
          select: { price: true, commission: true },
        },
      },
    });

    const tariff = updated.tariffs[0] ?? { price: 0, commission: 0 };

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      specialty: updated.specialty,
      description: updated.description,
      traits: updated.traits,
      photoUrl: updated.photoUrl,
      tariff: {
        price: tariff.price,
        commission: tariff.commission,
      },
      googleCalendarConnected: updated.googleCalendarConnected,
      googleCalendarEmail: updated.googleEmail,
    });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
