'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PackageStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
type PaymentMethod = 'WOMPI' | 'BANK_TRANSFER';

interface PackageStatusActionsProps {
  packageId: string;
  currentStatus: PackageStatus;
  paymentMethod: PaymentMethod;
  onStatusChange: () => void;
}

const STATUS_OPTIONS: { value: PackageStatus; label: string }[] = [
  { value: 'PENDING_PAYMENT', label: 'Pendiente de pago' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

/**
 * Contextual action buttons for managing package status.
 * - Confirm payment (only PENDING_PAYMENT + BANK_TRANSFER)
 * - Reject payment (only PENDING_PAYMENT)
 * - Change status dropdown (admin override)
 *
 * Validates: Requirements 5.3, 5.4, 5.5, 9.5
 */
export function PackageStatusActions({
  packageId,
  currentStatus,
  paymentMethod,
  onStatusChange,
}: PackageStatusActionsProps) {
  const [confirmDialog, setConfirmDialog] = useState<
    'confirm' | 'reject' | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStatusSelect, setShowStatusSelect] = useState(false);

  const canConfirmPayment =
    currentStatus === 'PENDING_PAYMENT' && paymentMethod === 'BANK_TRANSFER';
  const canReject = currentStatus === 'PENDING_PAYMENT';

  async function handleConfirmPayment() {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/confirm`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al confirmar pago');
      }

      toast.success('Pago confirmado exitosamente');
      setConfirmDialog(null);
      onStatusChange();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al confirmar pago',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/reject`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al rechazar pago');
      }

      toast.success('Pago rechazado');
      setConfirmDialog(null);
      onStatusChange();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al rechazar pago',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cambiar estado');
      }

      toast.success('Estado actualizado');
      setShowStatusSelect(false);
      onStatusChange();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al cambiar estado',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Confirm payment button */}
        {canConfirmPayment && (
          <Button
            size="sm"
            className="min-h-[44px] bg-grape text-white hover:bg-grape/90 sm:min-h-0"
            onClick={() => setConfirmDialog('confirm')}
            disabled={isProcessing}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Confirmar pago</span>
          </Button>
        )}

        {/* Reject button */}
        {canReject && (
          <Button
            variant="destructive"
            size="sm"
            className="min-h-[44px] sm:min-h-0"
            onClick={() => setConfirmDialog('reject')}
            disabled={isProcessing}
          >
            <XCircle className="h-4 w-4" />
            <span>Rechazar</span>
          </Button>
        )}

        {/* Change status toggle */}
        {!showStatusSelect ? (
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-0"
            onClick={() => setShowStatusSelect(true)}
            disabled={isProcessing}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Cambiar estado</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Select
              value={currentStatus}
              onValueChange={(val) => { if (val) handleStatusChange(val); }}
            >
              <SelectTrigger className="min-h-[44px] w-[180px] sm:min-h-0">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.filter(
                  (opt) => opt.value !== currentStatus,
                ).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] sm:min-h-0"
              onClick={() => setShowStatusSelect(false)}
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Confirm payment dialog */}
      <Dialog
        open={confirmDialog === 'confirm'}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pago de transferencia</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de confirmar el pago de este paquete? Se crearán
              automáticamente todas las citas programadas y eventos de Google
              Calendar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              className="bg-grape text-white hover:bg-grape/90"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar pago'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject payment dialog */}
      <Dialog
        open={confirmDialog === 'reject'}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pago</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de rechazar este pago? El paquete será cancelado y
              no se crearán las citas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rechazando...
                </>
              ) : (
                'Rechazar pago'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
