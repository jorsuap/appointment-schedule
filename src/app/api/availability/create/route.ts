import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/availability/create — Add availability block for a professional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { professionalId, dayOfWeek, startTime, endTime } = body;

    if (!professionalId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const availability = await prisma.availability.create({
      data: {
        professionalId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        isActive: true,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error('Error creating availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
