import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const services: Record<string, 'ok' | 'error'> = {};
  let allOk = true;

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database = 'ok';
  } catch {
    services.database = 'error';
    allOk = false;
  }

  // Check Resend config
  services.email = process.env.RESEND_API_KEY ? 'ok' : 'error';
  if (!process.env.RESEND_API_KEY) allOk = false;

  // Check Wompi config
  const wompiConfigured = !!(
    process.env.WOMPI_PUBLIC_KEY &&
    process.env.WOMPI_PRIVATE_KEY &&
    process.env.WOMPI_EVENTS_SECRET
  );
  services.payments = wompiConfigured ? 'ok' : 'error';
  if (!wompiConfigured) allOk = false;

  // Check Auth config
  services.auth = process.env.NEXTAUTH_SECRET ? 'ok' : 'error';
  if (!process.env.NEXTAUTH_SECRET) allOk = false;

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', services },
    { status: allOk ? 200 : 503 },
  );
}
