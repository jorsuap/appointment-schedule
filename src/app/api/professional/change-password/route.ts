import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getProfessionalSession } from '@/lib/get-professional-session';
import { changePasswordSchema } from '@/lib/validations/professional-profile';

export async function POST(request: NextRequest) {
  const { error, session } = await getProfessionalSession();
  if (error) return error;

  // Parse and validate body
  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  // Get user from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Compare currentPassword with stored hash
  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isCurrentValid) {
    return NextResponse.json(
      { error: 'WRONG_CURRENT_PASSWORD' },
      { status: 401 }
    );
  }

  // Hash new password and update user
  const newHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  return NextResponse.json({ success: true });
}
