'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Package, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SessionPackageItem {
  id: string;
  sessionCount: number;
  totalPrice: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  patient: { id: string; fullName: string };
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  CONFIRMED: 'bg-green-100 text-green-800 hover:bg-green-100',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));

/**
 * Professional package list with search by patient name.
 * Mobile-first: card layout on mobile, table on desktop.
 * Links to detail view and new package creation.
 *
 * Validates: Requirements 9.1
 */
export function PackageList() {
  const [packages, setPackages] = useState<SessionPackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);

      const url = `/api/professional/packages${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar paquetes');
      const data = await res.json();
      setPackages(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al cargar paquetes',
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-grape">
              <Package className="h-5 w-5 text-plum" />
              Mis Paquetes
            </CardTitle>
            <CardDescription>
              Paquetes de sesiones creados para tus pacientes
            </CardDescription>
          </div>
          <Button
            asChild
            size="lg"
            className="min-h-[44px] bg-grape text-white hover:bg-grape/90"
          >
            <Link href="/profesional/paquetes/nuevo">
              <Plus className="h-4 w-4" />
              <span>Nuevo Paquete</span>
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px] pl-9 sm:min-h-0"
            aria-label="Buscar paquetes por nombre de paciente"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-grape" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && packages.length === 0 && (
          <div className="rounded-xl border border-dashed border-plum/40 bg-lilac/50 p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-plum/50" />
            <p className="mt-2 text-sm font-medium text-grape">
              No tienes paquetes aún
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {debouncedSearch
                ? 'No se encontraron paquetes con ese nombre de paciente'
                : 'Crea tu primer paquete de sesiones para un paciente'}
            </p>
            {!debouncedSearch && (
              <Button
                asChild
                size="lg"
                className="mt-4 min-h-[44px] bg-grape text-white hover:bg-grape/90"
              >
                <Link href="/profesional/paquetes/nuevo">
                  <Plus className="h-4 w-4" />
                  <span>Crear Paquete</span>
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Mobile: Card layout */}
        {!isLoading && packages.length > 0 && (
          <>
            <div className="space-y-3 lg:hidden">
              {packages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/profesional/paquetes/${pkg.id}`}
                  className="block"
                >
                  <Card className="border-plum/20 transition-colors hover:border-plum/40 hover:bg-plum/5">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-grape">
                            {pkg.patient.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(pkg.createdAt)}
                          </p>
                        </div>
                        <Badge className={STATUS_BADGE_STYLES[pkg.status]}>
                          {STATUS_LABELS[pkg.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sesiones: </span>
                          <span className="font-medium">{pkg.sessionCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total: </span>
                          <span className="font-medium">
                            {formatCOP(pkg.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Sesiones</TableHead>
                      <TableHead>Precio Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha creación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id} className="cursor-pointer hover:bg-plum/5">
                        <TableCell>
                          <Link
                            href={`/profesional/paquetes/${pkg.id}`}
                            className="font-medium text-grape hover:underline"
                          >
                            {pkg.patient.fullName}
                          </Link>
                        </TableCell>
                        <TableCell>{pkg.sessionCount}</TableCell>
                        <TableCell>{formatCOP(pkg.totalPrice)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE_STYLES[pkg.status]}>
                            {STATUS_LABELS[pkg.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(pkg.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
