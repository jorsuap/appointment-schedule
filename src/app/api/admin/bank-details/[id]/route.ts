import { NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { bankDetailsSchema } from '@/lib/validations/packages';

/**
 * PUT /api/admin/bank-details/[id]
 * Validates with bankDetailsSchema and updates BankDetails by id.
 * Supports toggle isActive.
 * Requirements: 6.1, 6.2
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = bankDetailsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.bankDetails.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const bankDetails = await prisma.bankDetails.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(bankDetails);
  } catch (err) {
    console.error('Admin bank-details PUT error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/bank-details/[id]
 * Deletes BankDetails by id.
 * Requirements: 6.1
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.bankDetails.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    await prisma.bankDetails.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin bank-details DELETE error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
