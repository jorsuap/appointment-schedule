'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiscountTierForm } from '@/components/admin/packages/discount-tier-form';
import { DiscountTierList } from '@/components/admin/packages/discount-tier-list';

/**
 * Admin page for managing discount tiers (Tramos de Descuento).
 * Renders DiscountTierForm (add new) + DiscountTierList with refresh-on-success pattern.
 *
 * Validates: Requirements 2.1
 */
export default function DescuentosPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grape sm:text-3xl">
          Tramos de Descuento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura los descuentos escalonados por cantidad de sesiones en un paquete
        </p>
      </div>

      <Card className="border-plum/20">
        <CardHeader>
          <CardTitle className="text-grape">Agregar nuevo tramo</CardTitle>
        </CardHeader>
        <CardContent>
          <DiscountTierForm onSuccess={() => setRefreshKey((k) => k + 1)} />
        </CardContent>
      </Card>

      <DiscountTierList key={refreshKey} />
    </div>
  );
}
