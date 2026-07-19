import { prisma } from '@/lib/prisma';
import { CheckCircle2, CalendarDays, Clock, Video, Mail, AlertCircle } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; id?: string }>;
}) {
  const { ref } = await searchParams;

  // Try to find payment and appointment by reference
  let appointment = null;
  if (ref) {
    const payment = await prisma.payment.findUnique({
      where: { wompiReference: ref },
      include: {
        appointment: {
          include: { professional: true, service: true, patient: true },
        },
      },
    });
    appointment = payment?.appointment;
  }

  if (!appointment) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-jasmine/30">
            <AlertCircle className="h-8 w-8 text-grape" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-grape">Procesando tu pago</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu pago está siendo procesado. Recibirás un correo de confirmación cuando se complete.
            Si no lo recibes en unos minutos, verifica tu carpeta de spam.
          </p>
          <LinkButton href="/" variant="outline" size="lg" className="mt-8 h-12 w-full text-base">
            Volver al inicio
          </LinkButton>
        </div>
      </div>
    );
  }

  const dateStr = appointment.date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-grape sm:text-3xl">¡Cita confirmada!</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Tu pago fue procesado exitosamente. Hemos enviado los detalles a tu correo.
        </p>
      </div>

      <Card className="mt-8 border-border/40">
        <CardContent className="space-y-4 p-5">
          <h3 className="text-sm font-semibold text-grape">Detalles de tu cita</h3>

          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm capitalize">{dateStr}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">
              {appointment.startTime} hrs — {appointment.service.durationMin} minutos
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">
              {appointment.meetLink ? (
                <a href={appointment.meetLink} target="_blank" rel="noopener noreferrer" className="font-medium text-grape underline">
                  Unirse a Google Meet
                </a>
              ) : (
                'Sesión online — el link se enviará a tu correo'
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">Confirmación enviada a {appointment.patient.email}</span>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Profesional:</span> <strong>{appointment.professional.name}</strong></p>
            <p><span className="text-muted-foreground">Servicio:</span> <strong>{appointment.service.name}</strong></p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              El link de Google Meet será enviado a tu correo y agregado automáticamente a tu
              calendario de Google. Si no lo ves, revisa tu carpeta de spam.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <LinkButton href="/" variant="outline" size="lg" className="h-12 w-full text-base">
          Volver al inicio
        </LinkButton>
      </div>
    </div>
  );
}
