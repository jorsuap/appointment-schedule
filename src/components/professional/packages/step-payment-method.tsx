'use client';

import { CreditCard, Building2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PaymentMethod = 'wompi' | 'bank_transfer';

interface StepPaymentMethodProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
}[] = [
  {
    value: 'wompi',
    label: 'Link de pago Wompi',
    description: 'El paciente paga online con tarjeta o PSE',
    icon: CreditCard,
  },
  {
    value: 'bank_transfer',
    label: 'Transferencia bancaria',
    description:
      'El paciente hace transferencia y el admin confirma manualmente',
    icon: Building2,
  },
];

/**
 * Step 4 of the package wizard — Payment method selection.
 * Presents two radio cards: Wompi Payment Link or Bank Transfer.
 *
 * Validates: Requirements 4.1, 5.1
 */
export function StepPaymentMethod({
  selected,
  onSelect,
}: StepPaymentMethodProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-grape">
        ¿Cómo pagará el paciente?
      </p>

      <div className="grid gap-3">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          const Icon = option.icon;

          return (
            <Card
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelect(option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(option.value);
                }
              }}
              className={cn(
                'cursor-pointer transition-colors min-h-[44px]',
                isSelected
                  ? 'border-grape ring-2 ring-grape bg-plum/10'
                  : 'hover:border-plum/50',
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-plum/30 text-grape' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? 'text-grape' : 'text-foreground',
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                {/* Radio indicator */}
                <div
                  className={cn(
                    'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center',
                    isSelected ? 'border-grape' : 'border-muted-foreground/40',
                  )}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-grape" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
