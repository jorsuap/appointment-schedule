# Design Document: Manual Patient Creation

## Overview

This feature adds manual patient creation to the professional portal, allowing professionals to register patients who arrive through external channels (WhatsApp, phone, in-person) without depending on the public booking flow.

The implementation consists of:

- A new page at `/profesional/pacientes/nuevo` with a multi-section form
- A new API route `POST /api/professional/patients` that performs patient upsert + registration appointment creation in a single transaction
- A Zod validation schema for server-side and client-side validation
- A modification to the existing `PatientList` component to add the "Agregar Paciente" button

The patient is linked to the professional via a `Registration_Appointment` (status CONFIRMED), which makes the patient appear in the professional's patient list query without modifying existing API endpoints.

## Architecture

```mermaid
flowchart TD
    A[PatientList - Button "Agregar Paciente"] -->|router.push| B[/profesional/pacientes/nuevo]
    B --> C[PatientForm Component - Client]
    C -->|React Hook Form + Zod| D{Client Validation}
    D -->|Invalid| C
    D -->|Valid| E[POST /api/professional/patients]
    E --> F[getProfessionalSession]
    F -->|401/403| G[Error Response]
    F -->|OK| H[Zod Server Validation]
    H -->|422| I[Validation Error Response]
    H -->|OK| J[prisma.$transaction]
    J --> K[patient.upsert by email]
    J --> L{Has existing CONFIRMED/COMPLETED appointment?}
    L -->|Yes| M[Skip appointment creation]
    L -->|No| N[Create Registration_Appointment]
    N --> O[Get first ProfessionalService]
    M --> P[Return patient data]
    N --> P
    P --> Q[Client: toast.success + router.push]
```

### Request/Response Flow

1. **Client** renders `PatientForm` with React Hook Form bound to Zod schema
2. **Client-side validation** via `zodResolver` prevents submission with invalid data
3. **POST request** to `/api/professional/patients` with form data as JSON body
4. **Server** validates session via `getProfessionalSession()`, then validates body with Zod
5. **Transaction** performs upsert + conditional appointment creation
6. **Response** returns `{ patient, appointmentCreated: boolean }` on success
7. **Client** shows toast and navigates back to patient list

## Components and Interfaces

### New Files

| File                                                          | Type                 | Purpose                           |
| ------------------------------------------------------------- | -------------------- | --------------------------------- |
| `src/app/(professional)/profesional/pacientes/nuevo/page.tsx` | Server Component     | Page shell for the patient form   |
| `src/components/professional/patient-form.tsx`                | Client Component     | Form with React Hook Form + Zod   |
| `src/lib/validations/patient.ts`                              | Shared Module        | Zod schema for patient creation   |
| `src/app/api/professional/patients/route.ts`                  | API Route (modified) | Add POST handler to existing file |

### Modified Files

| File                                           | Change                                  |
| ---------------------------------------------- | --------------------------------------- |
| `src/components/professional/patient-list.tsx` | Add "Agregar Paciente" button in header |
| `src/app/api/professional/patients/route.ts`   | Add POST export alongside existing GET  |

### Component: PatientForm

```typescript
// src/components/professional/patient-form.tsx
'use client';

interface PatientFormProps {}

// Uses React Hook Form with zodResolver(createPatientSchema)
// Sections: Datos Personales, Evaluación Emocional, Contacto de Emergencia, Consentimientos
// On success: toast.success + router.push('/profesional/pacientes')
// On error: toast.error with server message
// Loading state: disabled submit button + spinner
```

**Form sections layout:**

- Mobile: single column, full-width inputs, sections stacked vertically
- Desktop (lg:): 2-column grid for short fields (fullName + preferredName, email + country), single column for textareas

**Reusable components used:**

- `<CountrySelect value={v} onChange={fn} />` — for country and emergencyCountry
- `<DatePicker value={v} onChange={fn} mode="birthdate" />` — for dateOfBirth

### API Endpoint: POST /api/professional/patients

```typescript
// Added to existing src/app/api/professional/patients/route.ts

export async function POST(request: NextRequest) {
  // 1. Auth check
  const { error, professionalId } = await getProfessionalSession();
  if (error) return error;

  // 2. Parse & validate body
  const body = await request.json();
  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // 3. Transaction: upsert patient + conditional appointment
  const result = await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.upsert({ ... });

    // Check existing link
    const existingAppointment = await tx.appointment.findFirst({
      where: {
        patientId: patient.id,
        professionalId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    });

    let appointmentCreated = false;
    if (!existingAppointment) {
      // Get first service from professional's services
      const profService = await tx.professionalService.findFirst({
        where: { professionalId },
      });

      await tx.appointment.create({
        data: {
          patientId: patient.id,
          professionalId,
          serviceId: profService.serviceId,
          date: new Date(), // today
          startTime: '00:00',
          endTime: '00:01',
          status: 'CONFIRMED',
        },
      });
      appointmentCreated = true;
    }

    return { patient, appointmentCreated };
  });

  return NextResponse.json(result, { status: 201 });
}
```

## Data Models

No schema changes required. Uses existing models:

### Patient (existing)

```prisma
model Patient {
  id              String   @id @default(cuid())
  fullName        String        // Required
  preferredName   String?       // Optional
  email           String   @unique  // Upsert key
  dateOfBirth     DateTime      // Required
  country         String        // Required
  isAdult         Boolean  @default(true) // Required
  // ... emotional, emergency, consent fields (all optional except as noted)
}
```

### Appointment (existing) — Registration_Appointment shape

```typescript
{
  patientId: string,        // From upsert result
  professionalId: string,   // From session (NEVER from request body)
  serviceId: string,        // First ProfessionalService of the professional
  date: DateTime,           // new Date() — today
  startTime: '00:00',       // Fixed sentinel value
  endTime: '00:01',         // Fixed sentinel value
  status: 'CONFIRMED',     // Always CONFIRMED
}
```

### Zod Schema: createPatientSchema

```typescript
// src/lib/validations/patient.ts
import { z } from 'zod';

export const createPatientSchema = z.object({
  // Required personal
  fullName: z.string().min(1, 'El nombre completo es requerido').max(200),
  email: z.string().email('Ingresa un email válido'),
  dateOfBirth: z
    .string()
    .date()
    .refine((val) => new Date(val) < new Date(), 'La fecha de nacimiento debe ser en el pasado'),
  country: z.string().min(1, 'El país es requerido'),
  isAdult: z.boolean(),

  // Optional personal
  preferredName: z.string().max(100).optional().or(z.literal('')),

  // Optional emotional evaluation
  reasonForVisit: z.string().max(2000).optional().or(z.literal('')),
  recentFeelings: z.string().max(2000).optional().or(z.literal('')),
  selfHarmRisk: z.boolean().optional(),
  currentTreatment: z.boolean().optional(),
  previousDiagnosis: z.string().max(2000).optional().or(z.literal('')),
  desiredOutcome: z.string().max(2000).optional().or(z.literal('')),
  additionalNotes: z.string().max(2000).optional().or(z.literal('')),

  // Optional emergency contact
  emergencyName: z.string().max(200).optional().or(z.literal('')),
  emergencyRelation: z.string().max(100).optional().or(z.literal('')),
  emergencyPhone: z.string().max(30).optional().or(z.literal('')),
  emergencyCountry: z.string().max(100).optional().or(z.literal('')),

  // Consent
  dataPrivacyConsent: z.boolean().optional(),
  commsConsent: z.boolean().optional(),
  informedConsent: z.boolean().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Required field validation rejects incomplete data

_For any_ subset of required fields (fullName, email, dateOfBirth, country, isAdult) left empty or missing, the validation schema SHALL reject the input, and the error object SHALL contain error messages for exactly those missing fields.

**Validates: Requirements 3.1**

### Property 2: Schema rejects invalid email formats and future dates

_For any_ string that does not conform to a valid email format, the schema SHALL reject it. _For any_ date string representing a future date, the schema SHALL reject it as an invalid dateOfBirth.

**Validates: Requirements 3.2, 3.3**

### Property 3: Upsert by email — create or update, never duplicate

_For any_ valid patient data submitted to the API, if the email does not exist in the database, a new Patient record SHALL be created containing all provided fields. If the email already exists, the existing record SHALL be updated with the new data, and no duplicate record SHALL be created. The total count of patients with that email SHALL always be exactly 1.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Registration appointment links new patient to professional

_For any_ patient who does NOT have an existing CONFIRMED or COMPLETED appointment with the authenticated professional, the API SHALL create a Registration_Appointment with status CONFIRMED, linking the patient to the professional.

**Validates: Requirements 5.1, 5.2**

### Property 5: Existing link prevents duplicate registration appointment

_For any_ patient who already has a CONFIRMED or COMPLETED appointment with the authenticated professional, the API SHALL NOT create a new Registration_Appointment, and the total count of appointments for that patient-professional pair SHALL remain unchanged.

**Validates: Requirements 5.5**

### Property 6: professionalId sourced exclusively from session

_For any_ request to the patient creation endpoint, regardless of any professionalId value included in the request body, the created Registration_Appointment SHALL use exclusively the professionalId from the authenticated Professional_Session.

**Validates: Requirements 7.3**

## Error Handling

| Scenario                                 | HTTP Status | Error Code         | Client Behavior                                    |
| ---------------------------------------- | ----------- | ------------------ | -------------------------------------------------- |
| No session cookie                        | 401         | `UNAUTHORIZED`     | Redirect to login (middleware handles)             |
| Session exists but not PROFESSIONAL role | 403         | `FORBIDDEN`        | Show error toast                                   |
| Invalid form data (client-side)          | —           | —                  | Inline field errors, no request sent               |
| Invalid form data (server-side)          | 422         | `VALIDATION_ERROR` | Show inline errors from `details`                  |
| Professional has no configured services  | 400         | `NO_SERVICES`      | Show error toast: "Configura al menos un servicio" |
| Database error / unexpected              | 500         | `INTERNAL_ERROR`   | Show generic error toast                           |

### Error response format

```typescript
// Validation error
{ error: 'VALIDATION_ERROR', details: { fullName: ['required'], email: ['invalid'] } }

// Business error
{ error: 'NO_SERVICES' }

// Generic error
{ error: 'INTERNAL_ERROR' }
```

### Client error handling pattern

```typescript
try {
  const res = await fetch('/api/professional/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const json = await res.json();
    if (res.status === 422 && json.details) {
      // Map server field errors to form
      Object.entries(json.details).forEach(([field, messages]) => {
        setError(field, { message: messages[0] });
      });
    } else {
      toast.error(
        json.error === 'NO_SERVICES'
          ? 'Configura al menos un servicio antes de agregar pacientes'
          : 'Error al crear el paciente. Intenta de nuevo.',
      );
    }
    return;
  }

  const { patient } = await res.json();
  toast.success(`Paciente ${patient.fullName} registrado exitosamente`);
  router.push('/profesional/pacientes');
} catch {
  toast.error('Error de conexión. Verifica tu internet.');
}
```

## Testing Strategy

### Unit Tests (Example-based)

| Test                                                                           | Validates         |
| ------------------------------------------------------------------------------ | ----------------- |
| PatientForm renders all required fields and sections                           | Req 2.1–2.6       |
| PatientForm shows "Agregar Paciente" button in PatientList                     | Req 1.1           |
| Submit button disabled during loading                                          | Req 6.5           |
| Success toast displayed after creation                                         | Req 6.1           |
| Navigation to patient list after success                                       | Req 6.2           |
| Error toast on server 500                                                      | Req 6.4           |
| POST returns 401 without session                                               | Req 7.1, 7.2      |
| Registration appointment has correct fixed values (status, startTime, endTime) | Req 5.2, 5.3, 5.4 |
| Registration appointment uses professional's first service                     | Req 5.3           |

### Property-Based Tests

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (TypeScript PBT library, well-maintained, integrates with any test runner)

**Configuration:** Minimum 100 iterations per property test.

| Property                                       | Tag                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Property 1: Required field validation          | `Feature: manual-patient-creation, Property 1: Required field validation rejects incomplete data`          |
| Property 2: Invalid email/date rejection       | `Feature: manual-patient-creation, Property 2: Schema rejects invalid email formats and future dates`      |
| Property 3: Upsert by email                    | `Feature: manual-patient-creation, Property 3: Upsert by email — create or update, never duplicate`        |
| Property 4: Registration appointment creation  | `Feature: manual-patient-creation, Property 4: Registration appointment links new patient to professional` |
| Property 5: Skip existing link                 | `Feature: manual-patient-creation, Property 5: Existing link prevents duplicate registration appointment`  |
| Property 6: Session professionalId enforcement | `Feature: manual-patient-creation, Property 6: professionalId sourced exclusively from session`            |

### Integration Tests

| Test                                                                                                | Validates    |
| --------------------------------------------------------------------------------------------------- | ------------ |
| Full flow: submit form → patient appears in GET /api/professional/patients                          | Req 5.6, 8.2 |
| Transaction rollback: if appointment creation fails, patient is not persisted in inconsistent state | Req 4.4      |
| Middleware redirects unauthenticated access to login                                                | Req 1.4      |

### Test Setup Notes

- No test runner currently configured in the project. Recommend adding `vitest` + `@testing-library/react` for unit/property tests.
- Property tests for validation schema (Properties 1, 2) can run as pure function tests without DOM.
- Property tests for API logic (Properties 3–6) require Prisma mocking or an in-memory test database.
- Use `fast-check` arbitraries to generate valid/invalid patient data conforming to schema constraints.
