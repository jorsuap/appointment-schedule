# Implementation Plan: Manual Patient Creation

## Overview

Implement manual patient creation from the professional portal. The feature adds a form page, a Zod validation schema, a POST API handler with upsert + registration appointment logic, and a navigation button in the existing patient list. All code uses TypeScript with the existing Next.js App Router, React Hook Form, Zod, Prisma, and shadcn/ui patterns.

## Tasks

- [x] 1. Create validation schema and shared types
  - [x] 1.1 Create `src/lib/validations/patient.ts` with `createPatientSchema` Zod schema
    - Define all required fields: fullName, email, dateOfBirth, country, isAdult
    - Define all optional fields: preferredName, emotional evaluation, emergency contact, consents
    - Add email format validation, future date rejection for dateOfBirth, max lengths
    - Export `CreatePatientInput` type inferred from schema
    - Follow existing pattern from `src/lib/validations/packages.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_

  - [x] 1.2 Write property tests for validation schema (Properties 1 & 2)
    - Install `vitest` and `fast-check` as dev dependencies
    - Create `src/lib/validations/__tests__/patient.test.ts`
    - **Property 1: Required field validation rejects incomplete data**
    - **Validates: Requirements 3.1**
    - **Property 2: Schema rejects invalid email formats and future dates**
    - **Validates: Requirements 3.2, 3.3**

- [x] 2. Implement POST API endpoint
  - [x] 2.1 Add POST handler to `src/app/api/professional/patients/route.ts`
    - Import `createPatientSchema` from validations
    - Authenticate with `getProfessionalSession()`, return error if invalid
    - Parse and validate request body with Zod `safeParse`, return 422 on failure
    - Execute `prisma.$transaction` with patient upsert by email
    - Check for existing CONFIRMED/COMPLETED appointment with same professional
    - If no existing link, get first `ProfessionalService` and create Registration_Appointment
    - Handle NO_SERVICES case (400) when professional has no configured services
    - Return `{ patient, appointmentCreated }` with status 201
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Write property test for upsert behavior (Property 3)
    - Create `src/app/api/professional/patients/__tests__/route.test.ts`
    - Mock Prisma client for transaction testing
    - **Property 3: Upsert by email — create or update, never duplicate**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 2.3 Write property test for registration appointment logic (Property 4)
    - **Property 4: Registration appointment links new patient to professional**
    - **Validates: Requirements 5.1, 5.2**

  - [x] 2.4 Write property test for duplicate link prevention (Property 5)
    - **Property 5: Existing link prevents duplicate registration appointment**
    - **Validates: Requirements 5.5**

  - [x] 2.5 Write property test for session enforcement (Property 6)
    - **Property 6: professionalId sourced exclusively from session**
    - **Validates: Requirements 7.3**

- [x] 3. Checkpoint - Ensure validation and API logic work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create the patient form page and component
  - [x] 4.1 Create server page at `src/app/(professional)/profesional/pacientes/nuevo/page.tsx`
    - Server component that renders PatientForm
    - Include page metadata (title)
    - _Requirements: 1.2, 1.3_

  - [x] 4.2 Create `src/components/professional/patient-form.tsx` client component
    - Use `'use client'` directive
    - Initialize React Hook Form with `zodResolver(createPatientSchema)`
    - Organize form into 4 sections: Datos Personales, Evaluación Emocional, Contacto de Emergencia, Consentimientos
    - Required fields: fullName (Input), email (Input), dateOfBirth (DatePicker), country (CountrySelect), isAdult (Select sí/no)
    - Optional fields per section as defined in requirements
    - Mobile-first layout: single column base, `lg:grid-cols-2` for short fields
    - Submit handler: POST to `/api/professional/patients`, handle 422 by mapping server errors to form fields
    - On success: `toast.success` with patient name + `router.push('/profesional/pacientes')`
    - On error: `toast.error` with descriptive message
    - Loading state: disable submit button + show spinner during submission
    - Use shadcn/ui components (Input, Button, Select, Card, Label), Lucide icons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.4, 6.5_

  - [x] 4.3 Write unit tests for PatientForm component
    - Install `@testing-library/react` as dev dependency
    - Test renders all required fields and sections
    - Test submit button disabled during loading
    - Test inline validation errors display for empty required fields
    - _Requirements: 2.1, 2.6, 3.1, 6.5_

- [x] 5. Add navigation button to patient list
  - [x] 5.1 Modify `src/components/professional/patient-list.tsx` to add "Agregar Paciente" button
    - Add a Button with `UserPlus` icon in the header area (between title and search)
    - On click: `router.push('/profesional/pacientes/nuevo')`
    - Style: primary grape background, visible on both mobile and desktop
    - Ensure touch target ≥ 44px
    - _Requirements: 1.1, 1.2_

- [x] 6. Final checkpoint - Ensure all tests pass and integration works
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Test framework (vitest, fast-check, @testing-library/react) must be installed as part of test tasks since they are NOT currently in the project
- No Prisma schema changes or migrations are needed — existing Patient and Appointment models support everything
- The existing `GET` handler in the patients route file must remain unchanged

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["4.3"] }
  ]
}
```
