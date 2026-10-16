'use client';

import { Loader2, Package, Calendar, Clock, CreditCard, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type { WizardData } from './package-wizard';

interface StepSummaryProps {
  wizardData: WizardData;
  patientName: string;
  pricePerSession: number;
  discountPerSession: number;
  totalPrice: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Semanal (cada 7 días)',
  biweekly: 'Quincenal (cada 15 días)',
  monthly: 'Mensual (cada 30 días)',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wompi: 'Link de pago Wompi',
  bank_transfer: 'Transferencia bancaria',
};

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

/**
 * Step 5 of the package wizard — Final summary before creating the package.
 * Displays all wizard data (patient, sessions, frequency, start date, time,
 * payment method, total price) and a "Crear Paquete" CTA.
 *
 * Validates: Requirements 3.6, 4.3, 5.1
 */
export function StepSummary({
  wizardData,
  patientName,
  pricePerSession,
  discountPerSession,
  totalPrice,
  onConfirm,
  isSubmitting,
}: StepSummaryProps) {
  return (
    <div className="space-y-4">
      <p className="text-grape text-sm font-medium">
        Revisa los detalles antes de crear el paquete
      </p>

      <Card className="border-plum/30 bg-plum/5">
        <CardContent className="space-y-4 p-4">
          {/* Patient */}
          <SummaryRow
            icon={<User className="text-plum h-4 w-4" />}
            label="Paciente"
            value={patientName || '—'}
          />

          {/* Sessions */}
          <SummaryRow
            icon={<Package className="text-plum h-4 w-4" />}
            label="Sesiones"
            value={`${wizardData.sessionCount} ${wizardData.sessionCount === 1 ? 'sesión' : 'sesiones'}`}
          />

          {/* Frequency */}
          <SummaryRow
            icon={<Calendar className="text-plum h-4 w-4" />}
            label="Frecuencia"
            value={FREQUENCY_LABELS[wizardData.frequency] || wizardData.frequency}
          />

          {/* Start date */}
          <SummaryRow
            icon={<Calendar className="text-plum h-4 w-4" />}
            label="Fecha de inicio"
            value={formatDate(wizardData.startDate)}
          />

          {/* Time */}
          <SummaryRow
            icon={<Clock className="text-plum h-4 w-4" />}
            label="Hora"
            value={wizardData.startTime || '—'}
          />

          {/* Payment method */}
          <SummaryRow
            icon={<CreditCard className="text-plum h-4 w-4" />}
            label="Método de pago"
            value={PAYMENT_METHOD_LABELS[wizardData.paymentMethod] || wizardData.paymentMethod}
          />

          {/* Pricing */}
          <div className="border-plum/20 border-t pt-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Precio por sesión</span>
                <span className="font-medium">{formatCOP(pricePerSession)}</span>
              </div>
              {discountPerSession > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Descuento por sesión</span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    -{formatCOP(discountPerSession)}
                  </Badge>
                </div>
              )}
              <div className="border-plum/10 flex items-center justify-between border-t pt-2">
                <span className="text-grape text-sm font-semibold">Total del paquete</span>
                <span className="text-grape text-lg font-bold">{formatCOP(totalPrice)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm CTA */}
      <Button
        size="lg"
        className="bg-grape hover:bg-grape/90 min-h-[44px] w-full text-white"
        onClick={onConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando paquete...
          </>
        ) : (
          <>
            <Package className="mr-2 h-4 w-4" />
            Crear Paquete
          </>
        )}
      </Button>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-foreground text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
