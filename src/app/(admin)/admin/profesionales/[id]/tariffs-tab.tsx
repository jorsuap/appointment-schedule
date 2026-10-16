'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TariffEditModal } from './tariff-edit-modal';

interface Tariff {
  id: string;
  serviceName: string;
  price: number;
  commission: number;
}

interface TariffsTabProps {
  professionalId: string;
  tariffs: Tariff[];
}

export function TariffsTab({ professionalId, tariffs }: TariffsTabProps) {
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [open, setOpen] = useState(false);

  function handleEdit(tariff: Tariff) {
    setSelectedTariff(tariff);
    setOpen(true);
  }

  return (
    <>
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-grape text-base">Tarifas por servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tariffs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay tarifas configuradas.</p>
          ) : (
            tariffs.map((tariff) => {
              const netAmount = tariff.price - (tariff.price * tariff.commission) / 100;
              return (
                <div key={tariff.id} className="border-border/40 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-grape text-sm font-semibold">{tariff.serviceName}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11 gap-1"
                      onClick={() => handleEdit(tariff)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground text-xs">Precio</span>
                      <p className="font-medium">${tariff.price.toLocaleString('es-CO')} COP</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Comisión</span>
                      <p className="font-medium">{tariff.commission}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Neto profesional</span>
                      <p className="font-semibold text-green-600">
                        ${netAmount.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {selectedTariff && (
        <TariffEditModal
          professionalId={professionalId}
          tariff={selectedTariff}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
