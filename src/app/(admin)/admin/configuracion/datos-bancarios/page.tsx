'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BankDetailsForm } from '@/components/admin/packages/bank-details-form';
import { BankDetailsList } from '@/components/admin/packages/bank-details-list';

/**
 * Admin page for managing bank details (Datos Bancarios).
 * Renders BankDetailsForm (add new) + BankDetailsList with refresh-on-success pattern.
 *
 * Validates: Requirements 6.1
 */
export default function DatosBancariosPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grape sm:text-3xl">
          Datos Bancarios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura las cuentas bancarias para recibir pagos por transferencia
        </p>
      </div>

      <Card className="border-plum/20">
        <CardHeader>
          <CardTitle className="text-grape">Agregar cuenta bancaria</CardTitle>
        </CardHeader>
        <CardContent>
          <BankDetailsForm onSuccess={() => setRefreshKey((k) => k + 1)} />
        </CardContent>
      </Card>

      <BankDetailsList key={refreshKey} />
    </div>
  );
}
