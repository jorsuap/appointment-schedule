'use client';

import { Receipt } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// --- Types ---

export interface IncomeSessionDetail {
  appointmentId: string;
  date: string;
  patientName: string;
  serviceName: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: 'CONFIRMED' | 'COMPLETED';
}

interface IncomeTableProps {
  sessions: IncomeSessionDetail[];
}

// --- Formatters ---

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// --- Status Badge ---

function StatusBadge({ status }: { status: 'CONFIRMED' | 'COMPLETED' }) {
  if (status === 'COMPLETED') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        Completada
      </Badge>
    );
  }
  return (
    <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
      Confirmada
    </Badge>
  );
}

// --- Component ---

/**
 * Income table component for the professional portal.
 * Displays a detailed breakdown of each session: date, patient, service,
 * amount, commission %, commission $, and net amount.
 *
 * Mobile: card-based layout for touch-friendly browsing.
 * Desktop: full table with all columns visible.
 *
 * Validates: Requirements 9.3
 */
export function IncomeTable({ sessions }: IncomeTableProps) {
  if (sessions.length === 0) {
    return <EmptyState />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-grape">
            <Receipt className="h-5 w-5 text-plum" />
            Detalle de sesiones
          </CardTitle>
          <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
            {sessions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop: Table */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Comisión %</TableHead>
                <TableHead className="text-right">Comisión $</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.appointmentId}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(session.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {session.patientName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.serviceName}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCOP.format(session.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {session.commissionRate}%
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    -{formatCOP.format(session.commissionAmount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-grape">
                    {formatCOP.format(session.netAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={session.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: Card-based */}
        <ul className="space-y-3 lg:hidden">
          {sessions.map((session) => (
            <li
              key={session.appointmentId}
              className="rounded-lg border border-border/60 bg-secondary/30 p-4"
            >
              {/* Header: patient + status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {session.patientName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.serviceName}
                  </p>
                </div>
                <StatusBadge status={session.status} />
              </div>

              {/* Date */}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(session.date)}
              </p>

              {/* Amounts grid */}
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-secondary/50 p-3">
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Monto
                  </p>
                  <p className="mt-0.5 text-xs font-semibold">
                    {formatCOP.format(session.amount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Comisión ({session.commissionRate}%)
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-destructive">
                    -{formatCOP.format(session.commissionAmount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Neto
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-grape">
                    {formatCOP.format(session.netAmount)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// --- Empty State ---

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          No hay sesiones registradas en este período
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajusta el rango de fechas o espera a que se confirmen nuevas citas
        </p>
      </CardContent>
    </Card>
  );
}
