import { DollarSign, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IncomeSummaryProps {
  summary: {
    totalBilled: number;
    totalCommission: number;
    netIncome: number;
  };
}

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

/**
 * Income summary cards for the professional portal.
 * Displays total billed, commission deducted, and net income.
 *
 * Validates: Requirements 9.1
 */
export function IncomeSummary({ summary }: IncomeSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Total Facturado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4 text-plum" />
            Total Facturado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-grape">
            {formatCOP.format(summary.totalBilled)}
          </p>
        </CardContent>
      </Card>

      {/* Comisión Descontada */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4 text-plum" />
            Comisión Descontada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-destructive">
            -{formatCOP.format(summary.totalCommission)}
          </p>
        </CardContent>
      </Card>

      {/* Neto a Recibir */}
      <Card className="border-plum/30 bg-plum/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-grape">
            <TrendingUp className="h-4 w-4 text-grape" />
            Neto a Recibir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-grape">
            {formatCOP.format(summary.netIncome)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
