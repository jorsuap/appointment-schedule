'use client';

import { useCallback, useEffect, useState } from 'react';

import { IncomeFilters } from '@/components/professional/income-filters';
import { IncomeSummary } from '@/components/professional/income-summary';
import {
  IncomeTable,
  type IncomeSessionDetail,
} from '@/components/professional/income-table';
import { Card, CardContent } from '@/components/ui/card';

interface IncomeSummaryData {
  totalBilled: number;
  totalCommission: number;
  netIncome: number;
}

interface IncomeResponse {
  summary: IncomeSummaryData & { period: { start: string; end: string } };
  sessions: IncomeSessionDetail[];
}

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Ingresos page for the professional portal.
 * Manages date range state and fetches income data from the API.
 * Re-fetches automatically when the date range changes.
 *
 * Validates: Requirements 9.1, 9.2, 9.3
 */
export default function IngresosPage() {
  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [data, setData] = useState<IncomeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncome = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/professional/income?startDate=${start}&endDate=${end}`
      );

      if (!res.ok) {
        throw new Error('Error al cargar los ingresos');
      }

      const json: IncomeResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncome(startDate, endDate);
  }, [startDate, endDate, fetchIncome]);

  function handleDateChange(newStart: string, newEnd: string) {
    setStartDate(newStart);
    setEndDate(newEnd);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-grape">Ingresos</h1>

      <IncomeFilters
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {isLoading && <IncomeSkeleton />}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          <IncomeSummary summary={data.summary} />
          <IncomeTable sessions={data.sessions} />
        </>
      )}
    </div>
  );
}

function IncomeSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-8 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
