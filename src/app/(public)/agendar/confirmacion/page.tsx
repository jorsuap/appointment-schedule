import { CheckCircle2, CalendarDays, Clock, Video, Mail } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ConfirmacionPage() {
  // TODO: Fetch appointment details from DB based on query params or session

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
            <span className="text-sm">Martes 14 de julio, 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">09:00 hrs — 60 minutos</span>
          </div>
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">Sesión online vía Google Meet</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">Confirmación enviada a tu correo</span>
          </div>

          <Separator />

          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              El link de Google Meet será enviado a tu correo y agregado automáticamente a tu
              calendario de Google. Si no lo ves, revisa tu carpeta de spam.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        <LinkButton href="/" variant="outline" size="lg" className="h-12 w-full text-base">
          Volver al inicio
        </LinkButton>
      </div>
    </div>
  );
}
