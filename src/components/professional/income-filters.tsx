'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PresetType = 'este-mes' | 'mes-anterior' | 'personalizado';

interface IncomeFiltersProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

function getThisMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
}

function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    start: formatDateForInput(start),
    end: formatDateForInput(end),
  };
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Income filters component with date range presets.
 * Provides quick buttons for "Este mes", "Mes anterior",
 * and a custom date range picker using native HTML date inputs.
 *
 * Validates: Requirements 9.2
 */
export function IncomeFilters({
  startDate,
  endDate,
  onDateChange,
}: IncomeFiltersProps) {
  const [activePreset, setActivePreset] = useState<PresetType>('este-mes');

  function handlePreset(preset: PresetType) {
    setActivePreset(preset);

    if (preset === 'este-mes') {
      const { start, end } = getThisMonthRange();
      onDateChange(start, end);
    } else if (preset === 'mes-anterior') {
      const { start, end } = getLastMonthRange();
      onDateChange(start, end);
    }
    // 'personalizado' just reveals the inputs without changing dates
  }

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setActivePreset('personalizado');
    onDateChange(e.target.value, endDate);
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setActivePreset('personalizado');
    onDateChange(startDate, e.target.value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-grape">
          <CalendarDays className="h-5 w-5 text-plum" />
          Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset buttons — stack vertical on mobile, horizontal on sm+ */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activePreset === 'este-mes' ? 'default' : 'outline'}
            size="lg"
            className={
              activePreset === 'este-mes'
                ? 'min-h-11 bg-grape text-white hover:bg-grape/80'
                : 'min-h-11 border-plum/40 text-grape hover:bg-plum/10'
            }
            onClick={() => handlePreset('este-mes')}
          >
            Este mes
          </Button>
          <Button
            variant={activePreset === 'mes-anterior' ? 'default' : 'outline'}
            size="lg"
            className={
              activePreset === 'mes-anterior'
                ? 'min-h-11 bg-grape text-white hover:bg-grape/80'
                : 'min-h-11 border-plum/40 text-grape hover:bg-plum/10'
            }
            onClick={() => handlePreset('mes-anterior')}
          >
            Mes anterior
          </Button>
          <Button
            variant={activePreset === 'personalizado' ? 'default' : 'outline'}
            size="lg"
            className={
              activePreset === 'personalizado'
                ? 'min-h-11 bg-grape text-white hover:bg-grape/80'
                : 'min-h-11 border-plum/40 text-grape hover:bg-plum/10'
            }
            onClick={() => handlePreset('personalizado')}
          >
            Personalizado
          </Button>
        </div>

        {/* Custom date inputs — shown when "Personalizado" is active */}
        {activePreset === 'personalizado' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="income-start-date" className="text-sm text-grape">
                Desde
              </Label>
              <Input
                id="income-start-date"
                type="date"
                value={startDate}
                max={endDate}
                onChange={handleStartDateChange}
                className="min-h-11 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="income-end-date" className="text-sm text-grape">
                Hasta
              </Label>
              <Input
                id="income-end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={handleEndDateChange}
                className="min-h-11 text-base"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
