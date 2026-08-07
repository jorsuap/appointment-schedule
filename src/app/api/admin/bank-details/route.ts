import { NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { bankDetailsSchema } from '@/lib/validations/packages';

/**
 * GET /api/admin/bank-details
 * Returns all BankDetails (active and inactive) for admin management.
 * Requirements: 6.1
 */
export async function GET() {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const bankDetails = await prisma.bankDetails.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bankDetails);
  } catch (err) {
    console.error('Admin bank-details GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * POST /api/admin/bank-details
 * Validates with bankDetailsSchema and creates a new BankDetails record.
 * Requirements: 6.1, 6.2
 */
export async function POST(request: Request) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bankDetailsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const bankDetails = await prisma.bankDetails.create({
      data: parsed.data,
    });

    return NextResponse.json(bankDetails, { status: 201 });
  } catch (err) {
    console.error('Admin bank-details POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
