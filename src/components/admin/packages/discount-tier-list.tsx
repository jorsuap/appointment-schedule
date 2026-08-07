'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { DiscountTierForm } from './discount-tier-form';

interface DiscountTier {
  id: string;
  minSessions: number;
  maxSessions: number;
  discountPerSession: number;
}

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

/**
 * Lists all discount tiers fetched from GET /api/admin/discount-tiers.
 * Supports inline editing via DiscountTierForm, and deletion with confirmation dialog.
 *
 * Validates: Requirements 2.1
 */
export function DiscountTierList() {
  const [tiers, setTiers] = useState<DiscountTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<DiscountTier | null>(null);
  const [deletingTier, setDeletingTier] = useState<DiscountTier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTiers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/discount-tiers');
      if (!res.ok) throw new Error('Error al cargar los tramos de descuento');
      const data = await res.json();
      // Sort by minSessions ASC
      const sorted = [...data].sort(
        (a: DiscountTier, b: DiscountTier) => a.minSessions - b.minSessions,
      );
      setTiers(sorted);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Error al cargar los tramos de descuento',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  async function handleDelete() {
    if (!deletingTier) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/discount-tiers/${deletingTier.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar el tramo');
      }

      toast.success('Tramo de descuento eliminado');
      setDeletingTier(null);
      fetchTiers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al eliminar el tramo',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEditSuccess() {
    setEditingTier(null);
    fetchTiers();
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-grape" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-grape">Tramos de descuento</CardTitle>
          <CardDescription>
            Configuración de descuentos escalonados por cantidad de sesiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay tramos de descuento configurados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rango de sesiones</TableHead>
                    <TableHead>Descuento por sesión</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) =>
                    editingTier?.id === tier.id ? (
                      <TableRow key={tier.id}>
                        <TableCell colSpan={3} className="p-4">
                          <DiscountTierForm
                            tier={editingTier}
                            onSuccess={handleEditSuccess}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-muted-foreground"
                            onClick={() => setEditingTier(null)}
                          >
                            Cancelar edición
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={tier.id}>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-plum/20 text-grape"
                          >
                            {tier.minSessions} – {tier.maxSessions} sesiones
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCOP(tier.discountPerSession)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-grape hover:bg-plum/20"
                              onClick={() => setEditingTier(tier)}
                              aria-label={`Editar tramo ${tier.minSessions}-${tier.maxSessions}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletingTier(tier)}
                              aria-label={`Eliminar tramo ${tier.minSessions}-${tier.maxSessions}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingTier}
        onOpenChange={(open) => {
          if (!open) setDeletingTier(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tramo de descuento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el tramo de{' '}
              <strong>
                {deletingTier?.minSessions} – {deletingTier?.maxSessions}{' '}
                sesiones
              </strong>
              ? Esta acción no se puede deshacer. Los paquetes existentes no
              serán afectados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
