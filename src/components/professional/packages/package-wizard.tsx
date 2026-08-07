'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface WizardData {
  patientId: string;
  serviceId: string;
  sessionCount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  startTime: string;
  paymentMethod: 'wompi' | 'bank_transfer';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    patientId: '',
    serviceId: '',
    sessionCount: 1,
    frequency: 'weekly',
    startDate: '',
    startTime: '',
    paymentMethod: 'wompi',
  });

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
            <StepPlaceholder
              step={1}
              label="PatientSelect"
              wizardData={wizardData}
            />
          )}
          {currentStep === 2 && (
            <StepPlaceholder
              step={2}
              label="SessionsConfig"
              wizardData={wizardData}
            />
          )}
          {currentStep === 3 && (
            <StepPlaceholder
              step={3}
              label="Schedule"
              wizardData={wizardData}
            />
          )}
          {currentStep === 4 && (
            <StepPlaceholder
              step={4}
              label="PaymentMethod"
              wizardData={wizardData}
            />
          )}
          {currentStep === 5 && (
            <StepPlaceholder
              step={5}
              label="Summary"
              wizardData={wizardData}
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

          <Button
            size="lg"
            onClick={handleNext}
            disabled={currentStep === TOTAL_STEPS}
            className="min-h-[44px] min-w-[44px] bg-grape text-white hover:bg-grape/90"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Placeholder component rendered for each step until actual step components
 * are implemented (tasks 12.2-12.6).
 */
function StepPlaceholder({
  step,
  label,
  wizardData: _wizardData,
}: {
  step: number;
  label: string;
  wizardData: WizardData;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-plum/30 bg-plum/5 p-6">
      <p className="text-lg font-semibold text-grape">Paso {step}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
