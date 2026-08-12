import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextRequest } from 'next/server';

/**
 * Property-Based Tests for POST /api/professional/patients
 * Feature: manual-patient-creation
 *
 * These tests validate the API route's correctness properties using
 * fast-check to generate arbitrary inputs and ensure universal properties
 * hold across all valid scenarios.
 */

// --- Mocks ---

const mockGetProfessionalSession = vi.fn();
vi.mock('@/lib/get-professional-session', () => ({
  getProfessionalSession: () => mockGetProfessionalSession(),
}));

const mockTransaction = vi.fn();
const mockPatientUpsert = vi.fn();
const mockAppointmentFindFirst = vi.fn();
const mockAppointmentCreate = vi.fn();
const mockProfessionalServiceFindFirst = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

// --- Helpers ---

const SESSION_PROFESSIONAL_ID = 'prof-session-123';

function createValidRequestBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: 'María García',
    email: 'maria@example.com',
    dateOfBirth: '2000-01-15',
    country: 'Colombia',
    isAdult: true,
    ...overrides,
  };
}

function createNextRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/professional/patients', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function setupAuthenticatedSession(professionalId: string = SESSION_PROFESSIONAL_ID) {
  mockGetProfessionalSession.mockResolvedValue({
    error: null,
    session: { user: { role: 'PROFESSIONAL', professionalId } },
    professionalId,
  });
}

function setupTransaction() {
  mockTransaction.mockImplementation(async (fn) => {
    const tx = {
      patient: { upsert: mockPatientUpsert },
      appointment: { findFirst: mockAppointmentFindFirst, create: mockAppointmentCreate },
      professionalService: { findFirst: mockProfessionalServiceFindFirst },
    };
    return fn(tx);
  });
}

// --- Arbitraries ---

/** Arbitrary for CUID-like IDs (alphanumeric strings of realistic length) */
const cuidArbitrary: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{9}$/),
    fc.stringMatching(/^[a-z0-9]{10}$/),
  )
  .map(([a, b]) => a + b);

// --- Property 4 ---

describe('Feature: manual-patient-creation, Property 4: Registration appointment links new patient to professional', () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * Property: For any patient who does NOT have an existing CONFIRMED or COMPLETED
   * appointment with the authenticated professional, the API SHALL create a
   * Registration_Appointment with status CONFIRMED, linking the patient to the professional.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a CONFIRMED registration appointment linking patient to professional when no existing link exists', async () => {
    const { POST } = await import('../route');

    await fc.assert(
      fc.asyncProperty(cuidArbitrary, cuidArbitrary, async (professionalId, patientId) => {
        vi.clearAllMocks();
        setupAuthenticatedSession(professionalId);
        setupTransaction();

        // Patient upsert returns a patient with the generated ID
        mockPatientUpsert.mockResolvedValue({
          id: patientId,
          fullName: 'Test Patient',
          email: 'test@example.com',
        });

        // No existing CONFIRMED/COMPLETED appointment — patient is new to this professional
        mockAppointmentFindFirst.mockResolvedValue(null);

        // Professional has at least one configured service
        const mockServiceId = 'service-abc-123';
        mockProfessionalServiceFindFirst.mockResolvedValue({
          id: 'prof-service-1',
          professionalId,
          serviceId: mockServiceId,
        });

        // appointment.create resolves successfully
        mockAppointmentCreate.mockResolvedValue({
          id: 'appointment-new',
          patientId,
          professionalId,
          serviceId: mockServiceId,
          status: 'CONFIRMED',
        });

        // Act
        const request = createNextRequest(createValidRequestBody());
        const response = await POST(request);
        const json = await response.json();

        // Response indicates appointment was created
        expect(response.status).toBe(201);
        expect(json.appointmentCreated).toBe(true);

        // appointment.create was called exactly once
        expect(mockAppointmentCreate).toHaveBeenCalledTimes(1);

        // Appointment has status CONFIRMED
        const createCall = mockAppointmentCreate.mock.calls[0][0];
        expect(createCall.data.status).toBe('CONFIRMED');

        // Appointment links the correct patient and professional
        expect(createCall.data.patientId).toBe(patientId);
        expect(createCall.data.professionalId).toBe(professionalId);
      }),
      { numRuns: 100 },
    );
  });
});

// --- Arbitraries ---

/** Generates a valid email that passes Zod validation */
const validEmailArbitrary: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{1,10}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/),
    fc.constantFrom('com', 'org', 'net', 'io', 'co'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Generates a valid patient name (non-empty, max 200) */
const validNameArbitrary: fc.Arbitrary<string> = fc
  .stringMatching(/^[A-Za-z ]{1,50}$/)
  .filter((s) => s.trim().length > 0);

/** Generates a valid past date string in YYYY-MM-DD format */
const pastDateArbitrary: fc.Arbitrary<string> = fc
  .integer({ min: 365, max: 36500 })
  .map((daysAgo) => {
    const past = new Date();
    past.setDate(past.getDate() - daysAgo);
    return past.toISOString().split('T')[0];
  });

/** Generates a valid country name */
const countryArbitrary: fc.Arbitrary<string> = fc.constantFrom(
  'Colombia', 'México', 'Argentina', 'Chile', 'España', 'Perú', 'Ecuador',
);

/** Generates a complete valid patient body for the POST endpoint */
const validPatientBodyArbitrary = fc.record({
  fullName: validNameArbitrary,
  email: validEmailArbitrary,
  dateOfBirth: pastDateArbitrary,
  country: countryArbitrary,
  isAdult: fc.boolean(),
});

// --- Property 3 ---

describe('Feature: manual-patient-creation, Property 3: Upsert by email — create or update, never duplicate', () => {
  /**
   * **Validates: Requirements 4.1, 4.2, 4.3**
   *
   * For any valid patient data submitted to the API, if the email does not exist
   * in the database, a new Patient record SHALL be created. If the email already
   * exists, the existing record SHALL be updated with the new data and no duplicate
   * SHALL be created. The total count of patients with that email SHALL always be
   * exactly 1.
   */

  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthenticatedSession();
    setupTransaction();
  });

  it('creates a new patient when email does not exist, then updates on repeat — count always 1', async () => {
    const { POST } = await import('../route');

    await fc.assert(
      fc.asyncProperty(
        validPatientBodyArbitrary,
        fc.integer({ min: 1, max: 4 }),
        async (patientData, repeatCount) => {
          vi.clearAllMocks();
          setupAuthenticatedSession();
          setupTransaction();

          // In-memory store simulating DB uniqueness on email
          const store = new Map<string, { id: string; email: string; fullName: string }>();
          let idCounter = 0;

          mockPatientUpsert.mockImplementation(async ({ where, create, update }) => {
            const existing = store.get(where.email);
            if (existing) {
              const updated = { ...existing, ...update };
              store.set(where.email, updated);
              return updated;
            }
            idCounter++;
            const newPatient = { id: `patient-${idCounter}`, email: where.email, ...create };
            store.set(where.email, newPatient);
            return newPatient;
          });

          mockAppointmentFindFirst.mockResolvedValue(null);
          mockProfessionalServiceFindFirst.mockResolvedValue({ serviceId: 'svc-1' });
          mockAppointmentCreate.mockResolvedValue({ id: 'apt-1' });

          // Submit N times with the same email
          for (let i = 0; i < repeatCount; i++) {
            const request = createNextRequest(patientData);
            const response = await POST(request);
            expect(response.status).toBe(201);
          }

          // CRITICAL: exactly 1 patient with this email — no duplicates
          const patientsWithEmail = [...store.values()].filter(
            (p) => p.email === patientData.email,
          );
          expect(patientsWithEmail).toHaveLength(1);
          expect(store.size).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('updates existing patient data on repeat submission with same email', async () => {
    const { POST } = await import('../route');

    await fc.assert(
      fc.asyncProperty(
        validPatientBodyArbitrary,
        validNameArbitrary,
        countryArbitrary,
        async (initialData, updatedName, updatedCountry) => {
          vi.clearAllMocks();
          setupAuthenticatedSession();
          setupTransaction();

          const store = new Map<string, Record<string, unknown>>();
          let idCounter = 0;

          mockPatientUpsert.mockImplementation(async ({ where, create, update }) => {
            const existing = store.get(where.email);
            if (existing) {
              const updated = { ...existing, ...update };
              store.set(where.email, updated);
              return updated;
            }
            idCounter++;
            const newPatient = { id: `patient-${idCounter}`, email: where.email, ...create };
            store.set(where.email, newPatient);
            return newPatient;
          });

          mockAppointmentFindFirst.mockResolvedValue(null);
          mockProfessionalServiceFindFirst.mockResolvedValue({ serviceId: 'svc-1' });
          mockAppointmentCreate.mockResolvedValue({ id: 'apt-1' });

          // First call: creates patient
          const firstRequest = createNextRequest(initialData);
          const firstResponse = await POST(firstRequest);
          expect(firstResponse.status).toBe(201);

          // Second call: same email, different name/country → update
          const updatedData = { ...initialData, fullName: updatedName, country: updatedCountry };
          const secondRequest = createNextRequest(updatedData);
          const secondResponse = await POST(secondRequest);
          expect(secondResponse.status).toBe(201);

          const secondJson = await secondResponse.json();

          // Record updated with new data
          expect(secondJson.patient.fullName).toBe(updatedName);

          // Still exactly 1 patient
          expect(store.size).toBe(1);
          const stored = store.get(initialData.email);
          expect(stored).toBeDefined();
          expect(stored!.fullName).toBe(updatedName);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('creates separate patients for distinct emails — email is the upsert key', async () => {
    const { POST } = await import('../route');

    await fc.assert(
      fc.asyncProperty(
        fc.array(validPatientBodyArbitrary, { minLength: 2, maxLength: 5 })
          .map((patients) => {
            // Deduplicate by email
            const seen = new Set<string>();
            return patients.filter((p) => {
              if (seen.has(p.email)) return false;
              seen.add(p.email);
              return true;
            });
          })
          .filter((patients) => patients.length >= 2),
        async (patients) => {
          vi.clearAllMocks();
          setupAuthenticatedSession();
          setupTransaction();

          const store = new Map<string, Record<string, unknown>>();
          let idCounter = 0;

          mockPatientUpsert.mockImplementation(async ({ where, create, update }) => {
            const existing = store.get(where.email);
            if (existing) {
              const updated = { ...existing, ...update };
              store.set(where.email, updated);
              return updated;
            }
            idCounter++;
            const newPatient = { id: `patient-${idCounter}`, email: where.email, ...create };
            store.set(where.email, newPatient);
            return newPatient;
          });

          mockAppointmentFindFirst.mockResolvedValue(null);
          mockProfessionalServiceFindFirst.mockResolvedValue({ serviceId: 'svc-1' });
          mockAppointmentCreate.mockResolvedValue({ id: 'apt-1' });

          for (const patientData of patients) {
            const request = createNextRequest(patientData);
            const response = await POST(request);
            expect(response.status).toBe(201);
          }

          // Separate patients for each distinct email
          expect(store.size).toBe(patients.length);

          // Each email has exactly 1 patient
          for (const patientData of patients) {
            const patientsWithEmail = [...store.values()].filter(
              (p) => p.email === patientData.email,
            );
            expect(patientsWithEmail).toHaveLength(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// --- Property 5 ---

describe('Feature: manual-patient-creation, Property 5: Existing link prevents duplicate registration appointment', () => {
  /**
   * **Validates: Requirements 5.5**
   *
   * Property: For any patient who already has a CONFIRMED or COMPLETED appointment
   * with the authenticated professional, the API SHALL NOT create a new
   * Registration_Appointment, and the total count of appointments for that
   * patient-professional pair SHALL remain unchanged.
   */

  beforeEach(() => {
    vi.clearAllMocks();
    setupAuthenticatedSession();
    setupTransaction();
  });

  /**
   * Arbitrary that generates existing appointment statuses that block
   * duplicate registration appointment creation.
   */
  const existingLinkStatusArbitrary: fc.Arbitrary<string> = fc.constantFrom(
    'CONFIRMED',
    'COMPLETED',
  );

  it('does NOT create a new appointment when patient already has a CONFIRMED or COMPLETED appointment', async () => {
    const { POST } = await import('../route');

    await fc.assert(
      fc.asyncProperty(existingLinkStatusArbitrary, async (existingStatus) => {
        vi.clearAllMocks();
        setupAuthenticatedSession();
        setupTransaction();

        const patientId = 'patient-existing-123';

        // Patient upsert returns an existing patient
        mockPatientUpsert.mockResolvedValue({
          id: patientId,
          fullName: 'María García',
          email: 'maria@example.com',
        });

        // Existing appointment found with CONFIRMED or COMPLETED status
        mockAppointmentFindFirst.mockResolvedValue({
          id: 'existing-apt-1',
          patientId,
          professionalId: SESSION_PROFESSIONAL_ID,
          status: existingStatus,
        });

        const request = createNextRequest(createValidRequestBody());
        const response = await POST(request);
        const json = await response.json();

        // appointment.create SHALL NOT be called
        expect(mockAppointmentCreate).not.toHaveBeenCalled();

        // appointmentCreated SHALL be false
        expect(json.appointmentCreated).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('the total count of appointments remains unchanged when existing link exists', async () => {
    const { POST } = await import('../route');

    await fc.assert(
      fc.asyncProperty(
        existingLinkStatusArbitrary,
        fc.integer({ min: 1, max: 50 }),
        async (existingStatus, existingCount) => {
          vi.clearAllMocks();
          setupAuthenticatedSession();
          setupTransaction();

          const patientId = 'patient-existing-456';
          let createCallCount = 0;

          // Patient upsert returns a patient
          mockPatientUpsert.mockResolvedValue({
            id: patientId,
            fullName: 'Test Patient',
            email: 'test@example.com',
          });

          // Existing appointment is found (simulating existing link)
          mockAppointmentFindFirst.mockResolvedValue({
            id: `existing-apt-${existingCount}`,
            patientId,
            professionalId: SESSION_PROFESSIONAL_ID,
            status: existingStatus,
          });

          // Track create calls to verify count remains unchanged
          mockAppointmentCreate.mockImplementation(async () => {
            createCallCount++;
            return { id: 'should-not-be-created' };
          });

          const request = createNextRequest(createValidRequestBody());
          await POST(request);

          // No new appointments created — count remains unchanged
          expect(createCallCount).toBe(0);
          expect(mockAppointmentCreate).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});


// --- Property 6 ---

describe('Feature: manual-patient-creation, Property 6: professionalId sourced exclusively from session', () => {
  /**
   * **Validates: Requirements 7.3**
   *
   * Property: For any request to the patient creation endpoint, regardless of any
   * professionalId value included in the request body, the created Registration_Appointment
   * SHALL use exclusively the professionalId from the authenticated Professional_Session.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Arbitrary for CUID-like identifiers */
  const cuidArbitrary = fc
    .stringMatching(/^[a-z0-9]{20,30}$/)
    .filter((s) => s.length >= 20);

  it('appointment is always created with session professionalId, never body professionalId', async () => {
    const { POST } = await import('../route');

    await fc.assert(
      fc.asyncProperty(
        cuidArbitrary,
        cuidArbitrary,
        async (sessionProfessionalId, bodyProfessionalId) => {
          // Ensure the two IDs are different to make the test meaningful
          fc.pre(sessionProfessionalId !== bodyProfessionalId);

          vi.clearAllMocks();

          // Track what professionalId was used in appointment creation
          let capturedProfessionalId: string | null = null;

          // Mock session to return sessionProfessionalId
          mockGetProfessionalSession.mockResolvedValue({
            error: null,
            session: {
              user: {
                role: 'PROFESSIONAL',
                professionalId: sessionProfessionalId,
              },
            },
            professionalId: sessionProfessionalId,
          });

          // Mock the transaction to execute the callback and capture professionalId
          mockTransaction.mockImplementation(async (fn) => {
            const tx = {
              patient: {
                upsert: vi.fn().mockResolvedValue({
                  id: 'patient-123',
                  fullName: 'Test Patient',
                  email: 'test@example.com',
                }),
              },
              appointment: {
                findFirst: vi.fn().mockResolvedValue(null), // No existing appointment
                create: vi.fn().mockImplementation((args) => {
                  capturedProfessionalId = args.data.professionalId;
                  return Promise.resolve({ id: 'appt-123', ...args.data });
                }),
              },
              professionalService: {
                findFirst: vi.fn().mockResolvedValue({
                  professionalId: sessionProfessionalId,
                  serviceId: 'service-001',
                }),
              },
            };
            return fn(tx);
          });

          // Build request body that includes bodyProfessionalId (attempting injection)
          const body = createValidRequestBody({ professionalId: bodyProfessionalId });
          const request = createNextRequest(body);

          const response = await POST(request);

          expect(response.status).toBe(201);

          // The appointment MUST use sessionProfessionalId
          expect(capturedProfessionalId).toBe(sessionProfessionalId);

          // The appointment MUST NOT use bodyProfessionalId
          expect(capturedProfessionalId).not.toBe(bodyProfessionalId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
