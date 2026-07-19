import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/professionals/create — Create a new professional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, specialty, description, traits, services, price, commission } = body;

    if (!name || !email || !specialty || !services?.length) {
      return NextResponse.json({ error: 'name, email, specialty and services are required' }, { status: 400 });
    }

    // Create professional (email is also used as calendarId for Google Meet)
    const professional = await prisma.professional.create({
      data: {
        name,
        email,
        specialty,
        description: description || null,
        traits: traits || [],
        calendarId: email,
      },
    });

    // Associate services
    if (services.length > 0) {
      await prisma.professionalService.createMany({
        data: services.map((serviceId: string) => ({
          professionalId: professional.id,
          serviceId,
        })),
        skipDuplicates: true,
      });
    }

    // Create tariffs for each service
    if (price && commission) {
      await prisma.professionalTariff.createMany({
        data: services.map((serviceId: string) => ({
          professionalId: professional.id,
          serviceId,
          price: Number(price),
          commission: Number(commission),
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    console.error('Error creating professional:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
