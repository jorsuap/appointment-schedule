import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Tests for GET /api/professional/availability/slots
 * Bugfix: la ventana de generación de slots se amplió de 60 a 180 días,
 * para que paquetes largos (p.ej. biweekly de 6 sesiones = 70 días) tengan
 * disponibilidad en todas sus fechas.
 */

const mockGetProfessionalSession = vi.fn();
vi.mock('@/lib/get-professional-session', () => ({
  getProfessionalSession: () => mockGetProfessionalSession(),
}));

const mockServiceFindUnique = vi.fn();
const mockAvailabilityFindMany = vi.fn();
const mockBlockedDateFindMany = vi.fn();
const mockAppointmentFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    service: { findUnique: (...a: unknown[]) => mockServiceFindUnique(...a) },
    availability: { findMany: (...a: unknown[]) => mockAvailabilityFindMany(...a) },
    blockedDate: { findMany: (...a: unknown[]) => mockBlockedDateFindMany(...a) },
    appointment: { findMany: (...a: unknown[]) => mockAppointmentFindMany(...a) },
  },
}));

const PROF = 'prof-1';

function req(serviceId = 'svc-1') {
  return new NextRequest(
    `http://localhost:3000/api/professional/availability/slots?serviceId=${serviceId}`,
  );
}

/** YYYY-MM-DD en local, igual que el endpoint para construir las fechas. */
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProfessionalSession.mockResolvedValue({ professionalId: PROF, error: null });
  mockServiceFindUnique.mockResolvedValue({ id: 'svc-1', durationMin: 60 });
  // Horario para TODOS los días de la semana 09:00-10:00 → 1 slot "09:00" por día.
  mockAvailabilityFindMany.mockResolvedValue(
    Array.from({ length: 7 }, (_, dow) => ({
      id: `a${dow}`,
      professionalId: PROF,
      dayOfWeek: dow,
      startTime: '09:00',
      endTime: '10:00',
      isActive: true,
    })),
  );
  mockBlockedDateFindMany.mockResolvedValue([]);
  mockAppointmentFindMany.mockResolvedValue([]);
});

describe('GET slots — ventana de 180 días', () => {
  it('genera slots para una fecha a 90 días (antes caía fuera de los 60)', async () => {
    const { GET } = await import('../route');
    const res = await GET(req());
    expect(res.status).toBe(200);
    const data = await res.json();

    const today = new Date();
    const day90 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 90);
    const key = localDateStr(day90);

    expect(Object.keys(data.slots)).toContain(key);
    expect(data.slots[key]).toContain('09:00');
  });

  it('genera slots hasta el día 180 inclusive y NO más allá', async () => {
    const { GET } = await import('../route');
    const res = await GET(req());
    const data = await res.json();

    const today = new Date();
    const day180 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 180);
    const day181 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 181);

    expect(Object.keys(data.slots)).toContain(localDateStr(day180));
    expect(Object.keys(data.slots)).not.toContain(localDateStr(day181));
  });

  it('cubre el horizonte de un paquete biweekly de 6 sesiones (70 días)', async () => {
    const { GET } = await import('../route');
    const res = await GET(req());
    const data = await res.json();

    const today = new Date();
    // Sesiones a 0,14,28,42,56,70 días desde una fecha de inicio cercana.
    // La sesión más lejana (70d) debe tener disponibilidad.
    const day70 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 70);
    expect(Object.keys(data.slots)).toContain(localDateStr(day70));
  });
});
