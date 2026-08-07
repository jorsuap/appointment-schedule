'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Package, Filter } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  paymentMethod: 'WOMPI' | 'BANK_TRANSFER';
  createdAt: string;
  professional: { name: string };
  patient: { fullName: string };
}

interface Professional {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING_PAYMENT', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'CANCELLED', label: 'Cancelados' },
] as const;

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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WOMPI: 'Wompi',
  BANK_TRANSFER: 'Transferencia',
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
 * Admin view of all session packages with filters by status and professional.
 * Mobile-first: card-based layout on mobile, table on desktop.
 *
 * Validates: Requirements 9.2
 */
export function AdminPackageList() {
  const [packages, setPackages] = useState<SessionPackageItem[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [professionalFilter, setProfessionalFilter] = useState('all');

  const fetchProfessionals = useCallback(async () => {
    try {
      const res = await fetch('/api/professionals');
      if (!res.ok) return;
      const data = await res.json();
      setProfessionals(data);
    } catch {
      // Silently fail — professionals list is supplementary
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (professionalFilter !== 'all')
        params.set('professionalId', professionalFilter);

      const url = `/api/admin/packages${params.toString() ? `?${params.toString()}` : ''}`;
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
  }, [statusFilter, professionalFilter]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-grape">
          <Package className="h-5 w-5 text-plum" />
          Paquetes de sesiones
        </CardTitle>
        <CardDescription>
          Gestión de todos los paquetes del sistema
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-plum" />
            <span className="text-sm font-medium text-grape">Filtros:</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => { if (val) setStatusFilter(val); }}
            >
              <SelectTrigger className="min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={professionalFilter}
              onValueChange={(val) => { if (val) setProfessionalFilter(val); }}
            >
              <SelectTrigger className="min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesionales</SelectItem>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <p className="mt-2 text-sm text-muted-foreground">
              No se encontraron paquetes
            </p>
          </div>
        )}

        {/* Mobile: Card-based layout */}
        {!isLoading && packages.length > 0 && (
          <>
            <div className="space-y-3 lg:hidden">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="border-plum/20">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-grape">
                          {pkg.professional.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Paciente: {pkg.patient.fullName}
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
                      <div>
                        <span className="text-muted-foreground">Pago: </span>
                        <span className="font-medium">
                          {PAYMENT_METHOD_LABELS[pkg.paymentMethod]}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha: </span>
                        <span className="font-medium">
                          {formatDate(pkg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Sesiones</TableHead>
                      <TableHead>Precio Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Método de pago</TableHead>
                      <TableHead>Fecha creación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">
                          {pkg.professional.name}
                        </TableCell>
                        <TableCell>{pkg.patient.fullName}</TableCell>
                        <TableCell>{pkg.sessionCount}</TableCell>
                        <TableCell>{formatCOP(pkg.totalPrice)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE_STYLES[pkg.status]}>
                            {STATUS_LABELS[pkg.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {PAYMENT_METHOD_LABELS[pkg.paymentMethod]}
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
