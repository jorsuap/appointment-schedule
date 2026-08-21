'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepPatientSelect } from './step-patient-select';
import { StepSessionsConfig } from './step-sessions-config';
import { StepSchedule } from './step-schedule';
import { StepPaymentMethod } from './step-payment-method';
import { StepSummary } from './step-summary';

export interface WizardData {
  patientId: string;
  serviceId: string;
  sessionCount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  startTime: string;
  paymentMethod: 'wompi' | 'bank_transfer';
  /** Per-session time overrides: key = session index (0-based), value = custom time */
  sessionTimeOverrides: Record<number, string>;
}

const TOTAL_STEPS = 5;

const STEP_LABELS: Record<number, string> = {
  1: 'Seleccionar Paciente',
  2: 'Configurar Sesiones',
  3: 'Programar Fechas',
  4: 'Método de Pago',
  5: 'Resumen',
};

/**
 * Multi-step wizard for creating a session package.
 * Manages step navigation (1-5) and shared wizard data.
 *
 * Steps:
 * 1. PatientSelect
 * 2. SessionsConfig
 * 3. Schedule
 * 4. PaymentMethod
 * 5. Summary
 *
 * Validates: Requirements 1.1, 3.6
 */
export function PackageWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [pricePerSession, setPricePerSession] = useState(0);
  const [discountPerSession, setDiscountPerSession] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    patientId: '',
    serviceId: '',
    sessionCount: 1,
    frequency: 'weekly',
    startDate: '',
    startTime: '',
    paymentMethod: 'wompi',
    sessionTimeOverrides: {},
  });

  // Auto-fetch the professional's first service to pre-populate serviceId
  useEffect(() => {
    async function fetchDefaultService() {
      try {
        const res = await fetch('/api/professional/services');
        if (res.ok) {
          const data = await res.json();
          const services = data.services ?? data ?? [];
          if (services.length > 0) {
            setWizardData((prev) => ({ ...prev, serviceId: services[0].serviceId || services[0].id }));
          }
        }
      } catch {
        // Silent fail — user can still proceed if serviceId gets set later
      }
    }
    fetchDefaultService();
  }, []);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!wizardData.patientId;
      case 2:
        return wizardData.sessionCount > 0 && !!wizardData.serviceId;
      case 3:
        return !!wizardData.startDate && !!wizardData.startTime;
      case 4:
        return !!wizardData.paymentMethod;
      default:
        return true;
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/professional/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || 'Error al crear el paquete');
        return;
      }

      toast.success('Paquete creado exitosamente');
      router.push('/profesional/paquetes');
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-grape">
            <Package className="h-5 w-5 text-plum" />
            Nuevo Paquete
          </CardTitle>
          <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
            Paso {currentStep} de {TOTAL_STEPS}
          </Badge>
        </div>
        {/* Step label */}
        <p className="text-sm text-muted-foreground">
          {STEP_LABELS[currentStep]}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step content */}
        <div className="min-h-[200px]">
          {currentStep === 1 && (
            <StepPatientSelect
              selectedPatientId={wizardData.patientId}
              onSelect={(patientId) => updateWizardData({ patientId })}
            />
          )}
          {currentStep === 2 && (
            <StepSessionsConfig
              sessionCount={wizardData.sessionCount}
              serviceId={wizardData.serviceId}
              onCountChange={(count) => updateWizardData({ sessionCount: count })}
              onServiceChange={(id) => updateWizardData({ serviceId: id })}
            />
          )}
          {currentStep === 3 && (
            <StepSchedule
              startDate={wizardData.startDate}
              startTime={wizardData.startTime}
              frequency={wizardData.frequency}
              sessionCount={wizardData.sessionCount}
              serviceId={wizardData.serviceId}
              sessionTimeOverrides={wizardData.sessionTimeOverrides}
              onDateChange={(date) => updateWizardData({ startDate: date })}
              onTimeChange={(time) => updateWizardData({ startTime: time, sessionTimeOverrides: {} })}
              onFrequencyChange={(frequency) => updateWizardData({ frequency, sessionTimeOverrides: {} })}
              onSessionTimeOverride={(idx, time) =>
                updateWizardData({
                  sessionTimeOverrides: { ...wizardData.sessionTimeOverrides, [idx]: time },
                })
              }
            />
          )}
          {currentStep === 4 && (
            <StepPaymentMethod
              selected={wizardData.paymentMethod}
              onSelect={(method) => updateWizardData({ paymentMethod: method })}
            />
          )}
          {currentStep === 5 && (
            <StepSummary
              wizardData={wizardData}
              patientName={patientName}
              pricePerSession={pricePerSession}
              discountPerSession={discountPerSession}
              totalPrice={totalPrice}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="min-h-[44px] min-w-[44px]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          {currentStep < TOTAL_STEPS && (
            <Button
              size="lg"
              onClick={handleNext}
              disabled={!canProceed()}
              className="min-h-[44px] min-w-[44px] bg-grape text-white hover:bg-grape/90"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
