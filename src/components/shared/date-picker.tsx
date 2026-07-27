'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

interface DatePickerProps {
  value?: string; // ISO date string "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  /** If true, uses a simple month navigation (no year dropdown, no past-only restriction) */
  mode?: 'birthdate' | 'general';
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecciona una fecha',
  mode = 'birthdate',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value + 'T12:00:00') : undefined;

  const defaultMonth = selectedDate ?? (mode === 'birthdate' ? new Date(2000, 0, 1) : new Date());

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          'h-10 w-full justify-start bg-white text-left text-base font-normal',
          !value && 'text-muted-foreground',
        )}
        onClick={() => setOpen(!open)}
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : placeholder}
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-border bg-white shadow-lg">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                const isoDate = format(date, 'yyyy-MM-dd');
                onChange(isoDate);
              }
              setOpen(false);
            }}
            defaultMonth={defaultMonth}
            {...(mode === 'birthdate'
              ? {
                  disabled: (date: Date) => date > new Date() || date < new Date('1920-01-01'),
                  captionLayout: 'dropdown' as const,
                  startMonth: new Date(1940, 0),
                  endMonth: new Date(),
                }
              : {})}
            className="rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
