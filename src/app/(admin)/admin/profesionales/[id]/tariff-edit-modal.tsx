'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { updateTariffSchema } from '@/lib/validations/tariffs';

interface TariffEditModalProps {
  professionalId: string;
  tariff: {
    id: string;
    serviceName: string;
    price: number;
    commission: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TariffEditModal({
  professionalId,
  tariff,
  open,
  onOpenChange,
}: TariffEditModalProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Resetear el estado local durante el render cuando cambie la tarifa o se
  // (re)abra el modal, en lugar de un efecto (patrón recomendado por React).
  const resetKey = `${tariff.id}:${open}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  const [price, setPrice] = useState<number>(tariff.price);
  const [commission, setCommission] = useState<number>(tariff.commission);

  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPrice(tariff.price);
    setCommission(tariff.commission);
  }

  // Neto profesional en vivo: price - (price * commission / 100).
  const netAmount = price - (price * commission) / 100;

  // Validación en cliente con el mismo schema del servidor.
  const validation = updateTariffSchema.safeParse({ price, commission });
  const fieldErrors = validation.success ? {} : validation.error.flatten().fieldErrors;
  const priceError = fieldErrors.price?.[0];
  const commissionError = fieldErrors.commission?.[0];

  async function handleSave() {
    if (!validation.success) return;

    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/professionals/${professionalId}/tariffs/${tariff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, commission }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error al actualizar la tarifa');
      }

      toast.success('Tarifa actualizada');
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      // Mantener el modal abierto para permitir reintento.
      toast.error(err instanceof Error ? err.message : 'Error al actualizar la tarifa');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tarifa</DialogTitle>
          <DialogDescription>
            Ajusta el precio y la comisión de{' '}
            <strong className="text-grape">{tariff.serviceName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Precio */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tariff-price" className="text-grape text-base">
              Precio (COP)
            </Label>
            <Input
              id="tariff-price"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="min-h-11 w-full text-base"
              value={Number.isNaN(price) ? '' : price}
              onChange={(e) => setPrice(e.target.valueAsNumber)}
              aria-invalid={priceError ? true : undefined}
              disabled={isSaving}
            />
            {priceError && <p className="text-destructive text-sm">{priceError}</p>}
          </div>

          {/* Comisión */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tariff-commission" className="text-grape text-base">
              Comisión (%)
            </Label>
            <Input
              id="tariff-commission"
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              className="min-h-11 w-full text-base"
              value={Number.isNaN(commission) ? '' : commission}
              onChange={(e) => setCommission(e.target.valueAsNumber)}
              aria-invalid={commissionError ? true : undefined}
              disabled={isSaving}
            />
            {commissionError && <p className="text-destructive text-sm">{commissionError}</p>}
          </div>

          {/* Neto profesional en vivo */}
          <div className="border-plum/40 bg-lilac rounded-lg border p-4">
            <span className="text-muted-foreground text-xs">Neto profesional</span>
            <p className="text-base font-semibold text-green-600">
              {validation.success ? `$${netAmount.toLocaleString('es-CO')} COP` : '—'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" className="min-h-11 min-w-11" disabled={isSaving} />}
          >
            Cancelar
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={isSaving || !validation.success}
            className="bg-grape hover:bg-grape/90 min-h-11 min-w-11 text-white"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
