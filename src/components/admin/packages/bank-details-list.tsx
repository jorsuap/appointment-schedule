'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Edit, Loader2, Trash2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BankDetailsForm } from './bank-details-form';

interface BankDetail {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  alias: string | null;
  isActive: boolean;
}

/**
 * List component for bank details management.
 * Fetches from GET /api/admin/bank-details,
 * supports edit, delete, and toggle active.
 *
 * Validates: Requirements 6.1, 6.3
 */
export function BankDetailsList() {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDetail, setEditingDetail] = useState<BankDetail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchBankDetails = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bank-details');
      if (!res.ok) throw new Error('Error al cargar datos bancarios');
      const data = await res.json();
      setBankDetails(data);
    } catch {
      toast.error('Error al cargar los datos bancarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankDetails();
  }, [fetchBankDetails]);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      '¿Estás seguro de eliminar estos datos bancarios? Esta acción no se puede deshacer.',
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/bank-details/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      toast.success('Datos bancarios eliminados');
      setBankDetails((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al eliminar datos bancarios',
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(detail: BankDetail) {
    setTogglingId(detail.id);
    try {
      const res = await fetch(`/api/admin/bank-details/${detail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: detail.bankName,
          accountType: detail.accountType,
          accountNumber: detail.accountNumber,
          accountHolder: detail.accountHolder,
          alias: detail.alias ?? '',
          isActive: !detail.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar estado');
      }

      toast.success(
        detail.isActive ? 'Datos bancarios desactivados' : 'Datos bancarios activados',
      );
      setBankDetails((prev) =>
        prev.map((d) =>
          d.id === detail.id ? { ...d, isActive: !d.isActive } : d,
        ),
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al cambiar estado',
      );
    } finally {
      setTogglingId(null);
    }
  }

  function handleEditSuccess() {
    setEditingDetail(null);
    fetchBankDetails();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-grape" />
      </div>
    );
  }

  if (bankDetails.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-plum/40 bg-lilac/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No hay datos bancarios configurados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editingDetail && (
        <Card className="border-plum/40 bg-lilac/30">
          <CardHeader>
            <CardTitle className="text-grape">Editar datos bancarios</CardTitle>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDetail(null)}
              >
                Cancelar
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <BankDetailsForm
              bankDetail={editingDetail}
              onSuccess={handleEditSuccess}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {bankDetails.map((detail) => (
          <Card key={detail.id} className="border-plum/20">
            <CardHeader>
              <CardTitle className="text-grape text-sm font-semibold">
                {detail.bankName}
              </CardTitle>
              <CardAction>
                <Badge
                  variant={detail.isActive ? 'default' : 'secondary'}
                  className={
                    detail.isActive
                      ? 'bg-grape/10 text-grape'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {detail.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Tipo: </span>
                  <span className="font-medium">{detail.accountType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Número: </span>
                  <span className="font-medium">{detail.accountNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Titular: </span>
                  <span className="font-medium">{detail.accountHolder}</span>
                </div>
                {detail.alias && (
                  <div>
                    <span className="text-muted-foreground">Alias: </span>
                    <span className="font-medium">{detail.alias}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-plum/10">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={detail.isActive}
                    onCheckedChange={() => handleToggleActive(detail)}
                    disabled={togglingId === detail.id}
                    className="data-checked:bg-grape data-checked:border-grape"
                  />
                  <span className="text-xs text-muted-foreground">
                    {togglingId === detail.id ? 'Actualizando...' : 'Activo'}
                  </span>
                </div>

                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingDetail(detail)}
                    aria-label={`Editar ${detail.bankName}`}
                  >
                    <Edit className="h-4 w-4 text-grape" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => handleDelete(detail.id)}
                    disabled={deletingId === detail.id}
                    aria-label={`Eliminar ${detail.bankName}`}
                  >
                    {deletingId === detail.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
