import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createPatientSchema } from '../patient';

/**
 * Property-Based Tests for createPatientSchema
 * Feature: manual-patient-creation
 *
 * These tests validate the validation schema's correctness properties
 * using fast-check to generate arbitrary inputs and ensure universal
 * properties hold across all valid/invalid combinations.
 */

// --- Helpers ---

const REQUIRED_FIELDS = ['fullName', 'email', 'dateOfBirth', 'country', 'isAdult'] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

/** Generates a valid base patient object that passes all validations */
function validPatientData(): Record<string, unknown> {
  return {
    fullName: 'María García',
    email: 'maria@example.com',
    dateOfBirth: '2000-01-15',
    country: 'Colombia',
    isAdult: true,
  };
}

/**
 * Generates an arbitrary non-empty subset of required fields.
 * Used to test that removing any combination of required fields
 * produces validation errors for exactly those fields.
 */
const nonEmptySubsetOfRequiredFields: fc.Arbitrary<RequiredField[]> = fc
  .subarray([...REQUIRED_FIELDS], { minLength: 1 })
  .filter((arr) => arr.length > 0);

// --- Property 1 ---

describe('Feature: manual-patient-creation, Property 1: Required field validation rejects incomplete data', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * Property: For any subset of required fields (fullName, email, dateOfBirth,
   * country, isAdult) left empty or missing, the validation schema SHALL reject
   * the input, and the error object SHALL contain error messages for exactly
   * those missing fields.
   */
  it('rejects input when any subset of required fields is removed, with errors for exactly those fields', () => {
    fc.assert(
      fc.property(nonEmptySubsetOfRequiredFields, (missingFields) => {
        // Start with a valid patient and remove the selected fields
        const data: Record<string, unknown> = { ...validPatientData() };

        for (const field of missingFields) {
          delete data[field];
        }

        const result = createPatientSchema.safeParse(data);

        // Schema MUST reject
        expect(result.success).toBe(false);

        if (!result.success) {
          const errorFields = Object.keys(result.error.flatten().fieldErrors);

          // Error object must contain errors for exactly the missing fields
          for (const field of missingFields) {
            expect(errorFields).toContain(field);
          }

          // No spurious errors for fields that are present and valid
          for (const field of REQUIRED_FIELDS) {
            if (!missingFields.includes(field)) {
              expect(errorFields).not.toContain(field);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('rejects input when required string fields are set to empty strings', () => {
    fc.assert(
      fc.property(
        fc.subarray(['fullName', 'country'] as const, { minLength: 1 }),
        (emptyFields) => {
          const data: Record<string, unknown> = { ...validPatientData() };

          for (const field of emptyFields) {
            data[field] = '';
          }

          const result = createPatientSchema.safeParse(data);

          expect(result.success).toBe(false);

          if (!result.success) {
            const errorFields = Object.keys(result.error.flatten().fieldErrors);
            for (const field of emptyFields) {
              expect(errorFields).toContain(field);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// --- Property 2 ---

describe('Feature: manual-patient-creation, Property 2: Schema rejects invalid email formats and future dates', () => {
  /**
   * **Validates: Requirements 3.2, 3.3**
   *
   * Property: For any string that does not conform to a valid email format,
   * the schema SHALL reject it. For any date string representing a future date,
   * the schema SHALL reject it as an invalid dateOfBirth.
   */

  /**
   * Arbitrary that generates strings guaranteed NOT to be valid emails.
   * Covers: missing @, missing domain, double @, spaces, missing TLD.
   */
  const invalidEmailArbitrary: fc.Arbitrary<string> = fc.oneof(
    // No @ symbol at all
    fc.string({ minLength: 1 }).filter((s) => !s.includes('@')),
    // @ at start (no local part)
    fc.string({ minLength: 1 }).map((s) => `@${s.replace(/@/g, '')}`),
    // @ at end (no domain)
    fc.string({ minLength: 1 }).map((s) => `${s.replace(/@/g, '')}@`),
    // Multiple @ symbols
    fc
      .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
      .map(([a, b, c]) => `${a}@${b}@${c}`),
    // Has spaces
    fc
      .tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
      .map(([a, b]) => `${a} ${b}@example.com`),
  );

  it('rejects any string that is not a valid email format', () => {
    fc.assert(
      fc.property(invalidEmailArbitrary, (invalidEmail) => {
        const data = {
          ...validPatientData(),
          email: invalidEmail,
        };

        const result = createPatientSchema.safeParse(data);

        expect(result.success).toBe(false);

        if (!result.success) {
          const errorFields = Object.keys(result.error.flatten().fieldErrors);
          expect(errorFields).toContain('email');
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Arbitrary that generates date strings guaranteed to be in the future.
   * Generates dates from tomorrow up to 100 years from now.
   */
  const futureDateArbitrary: fc.Arbitrary<string> = fc
    .integer({ min: 1, max: 36500 }) // 1 to 100 years in days
    .map((daysFromNow) => {
      const future = new Date();
      future.setDate(future.getDate() + daysFromNow);
      return future.toISOString().split('T')[0]; // YYYY-MM-DD format
    });

  it('rejects any future date as dateOfBirth', () => {
    fc.assert(
      fc.property(futureDateArbitrary, (futureDate) => {
        const data = {
          ...validPatientData(),
          dateOfBirth: futureDate,
        };

        const result = createPatientSchema.safeParse(data);

        expect(result.success).toBe(false);

        if (!result.success) {
          const errorFields = Object.keys(result.error.flatten().fieldErrors);
          expect(errorFields).toContain('dateOfBirth');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('accepts valid past dates as dateOfBirth', () => {
    const pastDateArbitrary: fc.Arbitrary<string> = fc
      .integer({ min: 1, max: 36500 })
      .map((daysAgo) => {
        const past = new Date();
        past.setDate(past.getDate() - daysAgo);
        return past.toISOString().split('T')[0];
      });

    fc.assert(
      fc.property(pastDateArbitrary, (pastDate) => {
        const data = {
          ...validPatientData(),
          dateOfBirth: pastDate,
        };

        const result = createPatientSchema.safeParse(data);

        // Should pass validation (no dateOfBirth error)
        if (!result.success) {
          const errorFields = Object.keys(result.error.flatten().fieldErrors);
          expect(errorFields).not.toContain('dateOfBirth');
        }
      }),
      { numRuns: 100 },
    );
  });
});
