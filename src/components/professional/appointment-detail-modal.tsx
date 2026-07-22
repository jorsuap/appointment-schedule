'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  User,
  Calendar,
  Clock,
  Video,
  CheckCircle,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Shape of an appointment object for the detail modal.
 */
export interface AppointmentForModal {
  id: string;
  patient: { fullName: string; email: string };
  service: { name: string; durationMin: number };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink: string | null;
  googleEventId: string | null;
}

interface AppointmentDetailModalProps {
  /** The appointment to display, or null to hide the modal. */
  appointment: AppointmentForModal | null;
  /** Called when the modal should close. */
  onClose: () => void;
  /** Called after successfully marking the appointment as completed. */
  onCompleted: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CONFIRMED: {
    label: 'Confirmada',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  COMPLETED: {
    label: 'Completada',
    className: 'bg-plum/20 text-grape border-plum/30',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  PENDING_PAYMENT: {
    label: 'Pendiente de pago',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  EXPIRED: {
    label: 'Expirada',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Modal de detalle de cita del profesional.
 * Muestra información completa: paciente, servicio, fecha/hora, link Meet y estado.
 * Permite marcar como completada solo si el estado es CONFIRMED.
 *
 * Validates: Requirements 7.2, 7.3
 */
export function AppointmentDetailModal({
  appointment,
  onClose,
  onCompleted,
}: AppointmentDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleMarkCompleted() {
    if (!appointment) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/professional/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error === 'INVALID_TRANSITION'
            ? 'Solo se pueden completar citas confirmadas'
            : data.error || 'Error al actualizar la cita'
        );
      }

      toast.success('Cita marcada como completada');
      onCompleted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al marcar como completada'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusConfig = appointment
    ? STATUS_CONFIG[appointment.status] || {
        label: appointment.status,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
      }
    : null;

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-grape">
            Detalle de cita
          </DialogTitle>
        </DialogHeader>

        {appointment && statusConfig && (
          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge className={`border ${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
            </div>

            {/* Patient info */}
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-grape">
                <User className="h-4 w-4 text-plum" />
                Paciente
              </div>
              <p className="text-sm font-semibold">
                {appointment.patient.fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                {appointment.patient.email}
              </p>
            </div>

            {/* Service info */}
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-grape">
                <CheckCircle className="h-4 w-4 text-plum" />
                Servicio
              </div>
              <p className="text-sm font-semibold">
                {appointment.service.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Duración: {appointment.service.durationMin} minutos
              </p>
            </div>

            {/* Date & time */}
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-grape">
                <Calendar className="h-4 w-4 text-plum" />
                Fecha y hora
              </div>
              <p className="text-sm font-semibold capitalize">
                {formatDate(appointment.date)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {appointment.startTime} – {appointment.endTime}
              </p>
            </div>

            {/* Meet link */}
            {appointment.meetLink && (
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-grape">
                  <Video className="h-4 w-4 text-plum" />
                  Google Meet
                </div>
                <a
                  href={appointment.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-grape underline underline-offset-2 hover:text-grape/80"
                >
                  Abrir videollamada
                </a>
              </div>
            )}

            {/* Mark as completed button - only visible for CONFIRMED status */}
            {appointment.status === 'CONFIRMED' && (
              <Button
                onClick={handleMarkCompleted}
                disabled={isSubmitting}
                className="h-11 w-full bg-grape text-base text-white hover:bg-grape/90"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Marcando...' : 'Marcar completada'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
