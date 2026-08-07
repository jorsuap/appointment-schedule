'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  Package,
  Video,
  XCircle,
} from 'lucide-react';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { PaymentLinkDisplay } from './payment-link-display';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink: string | null;
  googleEventId: string | null;
}

interface PackageDetail {
  id: string;
  sessionCount: number;
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  startDate: string;
  startTime: string;
  endTime: string;
  pricePerSession: number;
  discountPerSession: number;
  totalPrice: number;
  paymentMethod: 'WOMPI' | 'BANK_TRANSFER';
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  wompiPaymentLinkUrl: string | null;
  createdAt: string;
  patient: { id: string; fullName: string; email: string };
  professional: { id: string; name: string };
  appointments: Appointment[];
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  CONFIRMED: 'bg-green-100 text-green-800 hover:bg-green-100',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  WOMPI: 'Wompi',
  BANK_TRANSFER: 'Transferencia bancaria',
};

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));

interface PackageDetailProps {
  packageId: string;
}

/**
 * Professional package detail view.
 * Shows full package info: patient, sessions, pricing, frequency, appointments.
 * Conditionally shows payment link, cancel button based on status.
 *
 * Validates: Requirements 9.3, 9.4, 9.6
 */
export function PackageDetail({ packageId }: PackageDetailProps) {
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchPackage = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/professional/packages/${packageId}`);
      if (!res.ok) throw new Error('Error al cargar el paquete');
      const data = await res.json();
      setPkg(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al cargar el paquete',
      );
    } finally {
      setIsLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  async function handleCancel() {
    if (!pkg) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas cancelar este paquete? Esta acción no se puede deshacer.',
    );
    if (!confirmed) return;

    try {
      setIsCancelling(true);
      const res = await fetch(`/api/professional/packages/${packageId}/cancel`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al cancelar el paquete');
      }

      toast.success('Paquete cancelado exitosamente');
      fetchPackage();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al cancelar el paquete',
      );
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-grape" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="rounded-xl border border-dashed border-plum/40 bg-lilac/50 p-8 text-center">
        <Package className="mx-auto h-10 w-10 text-plum/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No se encontró el paquete
        </p>
        <Button
          variant="outline"
          className="mt-4 min-h-[44px]"
          onClick={() => router.push('/profesional/paquetes')}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a paquetes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + back button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="lg"
          className="min-h-[44px] w-fit text-grape"
          onClick={() => router.push('/profesional/paquetes')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Button>

        {pkg.status === 'PENDING_PAYMENT' && (
          <Button
            variant="destructive"
            size="lg"
            className="min-h-[44px]"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>Cancelar Paquete</span>
          </Button>
        )}
      </div>

      {/* Package info card */}
      <Card className="border-plum/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-grape">
              <Package className="h-5 w-5 text-plum" />
              Paquete de sesiones
            </CardTitle>
            <Badge className={STATUS_BADGE_STYLES[pkg.status]}>
              {STATUS_LABELS[pkg.status]}
            </Badge>
          </div>
          <CardDescription>
            Creado el {formatDate(pkg.createdAt)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Patient info */}
          <div className="rounded-lg bg-plum/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Paciente
            </p>
            <p className="mt-1 text-base font-semibold text-grape">
              {pkg.patient.fullName}
            </p>
            <p className="text-sm text-muted-foreground">{pkg.patient.email}</p>
          </div>

          {/* Session details grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailItem
              icon={<Calendar className="h-4 w-4 text-plum" />}
              label="Sesiones"
              value={String(pkg.sessionCount)}
            />
            <DetailItem
              icon={<Clock className="h-4 w-4 text-plum" />}
              label="Frecuencia"
              value={FREQUENCY_LABELS[pkg.frequency]}
            />
            <DetailItem
              icon={<Clock className="h-4 w-4 text-plum" />}
              label="Horario"
              value={`${pkg.startTime} - ${pkg.endTime}`}
            />
            <DetailItem
              icon={<CreditCard className="h-4 w-4 text-plum" />}
              label="Método de pago"
              value={PAYMENT_METHOD_LABELS[pkg.paymentMethod]}
            />
          </div>

          {/* Price breakdown */}
          <div className="rounded-lg border border-plum/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Desglose de precio
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio por sesión</span>
                <span>{formatCOP(pkg.pricePerSession)}</span>
              </div>
              {pkg.discountPerSession > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento por sesión</span>
                  <span>-{formatCOP(pkg.discountPerSession)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-plum/10 pt-1 font-semibold text-grape">
                <span>Total ({pkg.sessionCount} sesiones)</span>
                <span>{formatCOP(pkg.totalPrice)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment link display (Wompi + PENDING_PAYMENT) */}
      {pkg.status === 'PENDING_PAYMENT' &&
        pkg.paymentMethod === 'WOMPI' &&
        pkg.wompiPaymentLinkUrl && (
          <PaymentLinkDisplay
            linkUrl={pkg.wompiPaymentLinkUrl}
            patientName={pkg.patient.fullName}
          />
        )}

      {/* Appointments list (only when CONFIRMED) */}
      {pkg.status === 'CONFIRMED' && pkg.appointments.length > 0 && (
        <Card className="border-plum/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-grape">
              Citas programadas
            </CardTitle>
            <CardDescription>
              {pkg.appointments.length} citas creadas para este paquete
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Mobile: stacked cards */}
            <div className="space-y-2 lg:hidden">
              {pkg.appointments.map((appt, idx) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-lg border border-plum/10 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-grape">
                      Sesión {idx + 1} — {formatDate(appt.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appt.startTime} - {appt.endTime}
                    </p>
                  </div>
                  {appt.meetLink && (
                    <a
                      href={appt.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 flex h-9 w-9 items-center justify-center rounded-md bg-plum/10 text-grape hover:bg-plum/20"
                      aria-label={`Abrir Meet para sesión ${idx + 1}`}
                    >
                      <Video className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Meet Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pkg.appointments.map((appt, idx) => (
                    <TableRow key={appt.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{formatDate(appt.date)}</TableCell>
                      <TableCell>
                        {appt.startTime} - {appt.endTime}
                      </TableCell>
                      <TableCell>
                        {appt.meetLink ? (
                          <a
                            href={appt.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-grape hover:underline"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Abrir Meet
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No disponible
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-plum/10 p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-grape">{value}</p>
    </div>
  );
}
