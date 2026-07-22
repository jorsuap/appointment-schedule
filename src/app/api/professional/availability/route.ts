import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';
import { createAvailabilitySchema } from '@/lib/validations/professional-profile';

export async function GET() {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const [blocks, blockedDates] = await Promise.all([
      prisma.availability.findMany({
        where: { professionalId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.blockedDate.findMany({
        where: { professionalId },
        orderBy: { date: 'asc' },
      }),
    ]);

    return NextResponse.json({
      blocks: blocks.map((block) => ({
        id: block.id,
        dayOfWeek: block.dayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
        isActive: block.isActive,
      })),
      blockedDates: blockedDates.map((bd) => ({
        id: bd.id,
        date: bd.date.toISOString(),
        reason: bd.reason,
      })),
    });
  } catch (err) {
    console.error('Availability GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createAvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { dayOfWeek, startTime, endTime } = parsed.data;

    // Check for overlapping blocks on the same day for this professional
    const existingBlocks = await prisma.availability.findMany({
      where: { professionalId, dayOfWeek },
    });

    const hasOverlap = existingBlocks.some(
      (block) => block.startTime < endTime && block.endTime > startTime
    );

    if (hasOverlap) {
      return NextResponse.json({ error: 'OVERLAP_DETECTED' }, { status: 409 });
    }

    const newBlock = await prisma.availability.create({
      data: {
        professionalId,
        dayOfWeek,
        startTime,
        endTime,
      },
    });

    return NextResponse.json(
      {
        id: newBlock.id,
        dayOfWeek: newBlock.dayOfWeek,
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        isActive: newBlock.isActive,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Availability POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: { id: ['Required'] } },
        { status: 422 }
      );
    }

    // Verify block exists AND belongs to the authenticated professional
    const block = await prisma.availability.findFirst({
      where: { id, professionalId },
    });

    if (!block) {
      return NextResponse.json({ error: 'APPOINTMENT_NOT_FOUND' }, { status: 404 });
    }

    await prisma.availability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Availability DELETE error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
