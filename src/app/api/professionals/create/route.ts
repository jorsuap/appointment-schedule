import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateTempPassword } from '@/lib/password-generator';

// POST /api/professionals/create — Create a new professional with User account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, specialty, description, traits, services, price, commission } = body;

    if (!name || !email || !specialty || !services?.length) {
      return NextResponse.json({ error: 'name, email, specialty and services are required' }, { status: 400 });
    }

    // Generate temporary password for the professional's first login
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Use transaction to create User + Professional atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create User with role PROFESSIONAL and mustChangePassword flag
      const user = await tx.user.create({
        data: {
          email,
          name,
          role: 'PROFESSIONAL',
          mustChangePassword: true,
          passwordHash,
        },
      });

      // Create Professional linked to User (email is also used as calendarId for Google Meet)
      const professional = await tx.professional.create({
        data: {
          name,
          email,
          specialty,
          description: description || null,
          traits: traits || [],
          calendarId: email,
          userId: user.id,
        },
      });

      // Associate services
      if (services.length > 0) {
        await tx.professionalService.createMany({
          data: services.map((serviceId: string) => ({
            professionalId: professional.id,
            serviceId,
          })),
          skipDuplicates: true,
        });
      }

      // Create tariffs for each service
      if (price && commission) {
        await tx.professionalTariff.createMany({
          data: services.map((serviceId: string) => ({
            professionalId: professional.id,
            serviceId,
            price: Number(price),
            commission: Number(commission),
          })),
          skipDuplicates: true,
        });
      }

      return professional;
    });

    // Return professional data + temp password (shown once, never stored in plain text)
    return NextResponse.json({ ...result, tempPassword }, { status: 201 });
  } catch (error) {
    console.error('Error creating professional:', error);

    // Handle unique constraint violation (email already exists)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe un usuario o profesional con ese correo electrónico' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
