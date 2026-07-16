import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PatientData {
  fullName: string;
  preferredName?: string;
  dateOfBirth: string;
  email: string;
  country: string;
  isAdult: 'si' | 'no';
  minorConsent?: boolean;
  dataPrivacyConsent: boolean;
  commsConsent: boolean;
}

export interface EvaluationData {
  reasonForVisit: string;
  recentFeelings: string;
  selfHarmRisk: 'si' | 'no';
  currentTreatment: 'si' | 'no';
  previousDiagnosis?: string;
  desiredOutcome: string;
  additionalNotes?: string;
  informedConsent: boolean;
}

export interface EmergencyData {
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  emergencyCountry: string;
}

export interface BookingState {
  // Step tracking
  currentStep: number;

  // Step 1: Service selection
  serviceId: string | null;

  // Step 2: Patient data
  patientData: PatientData | null;

  // Step 3: Evaluation
  evaluationData: EvaluationData | null;

  // Step 4: Emergency contact
  emergencyData: EmergencyData | null;

  // Step 5: Professional
  professionalId: string | null;

  // Step 6: Schedule
  selectedDate: string | null;
  selectedTime: string | null;

  // Actions
  setServiceId: (id: string) => void;
  setPatientData: (data: PatientData) => void;
  setEvaluationData: (data: EvaluationData) => void;
  setEmergencyData: (data: EmergencyData) => void;
  setProfessionalId: (id: string) => void;
  setSchedule: (date: string, time: string) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  serviceId: null,
  patientData: null,
  evaluationData: null,
  emergencyData: null,
  professionalId: null,
  selectedDate: null,
  selectedTime: null,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...initialState,

      setServiceId: (id) => set({ serviceId: id, currentStep: 1 }),
      setPatientData: (data) => set({ patientData: data, currentStep: 2 }),
      setEvaluationData: (data) => set({ evaluationData: data, currentStep: 3 }),
      setEmergencyData: (data) => set({ emergencyData: data, currentStep: 4 }),
      setProfessionalId: (id) => set({ professionalId: id, currentStep: 5 }),
      setSchedule: (date, time) => set({ selectedDate: date, selectedTime: time, currentStep: 6 }),
      setCurrentStep: (step) => set({ currentStep: step }),
      reset: () => set(initialState),
    }),
    {
      name: 'conalma-booking',
      // Use sessionStorage so it clears when the tab closes
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const item = sessionStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          sessionStorage.removeItem(name);
        },
      },
    },
  ),
);
