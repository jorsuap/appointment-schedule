'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarDays, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const confirmarSchema = z.object({
  payerName: z.string().min(3, 'Ingresa tu nombre completo'),
  payerEmail: z.string().email('Ingresa un correo electrónico válido'),
  timezoneConfirm: z.boolean().refine((v) => v === true, {
    message: 'Confirma tu zona horaria',
  }),
  consentimiento: z.boolean().refine((v) => v === true, {
    message: 'Debes aceptar el consentimiento informado',
  }),
  commsAuthorization: z.boolean().refine((v) => v === true, {
    message: 'Debes autorizar las comunicaciones transaccionales',
  }),
});

type ConfirmarFormValues = z.infer<typeof confirmarSchema>;

export default function ConfirmarPage() {
  const searchParams = useSearchParams();
  const fecha = searchParams.get('fecha');
  const hora = searchParams.get('hora');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConfirmarFormValues>({
    resolver: zodResolver(confirmarSchema),
    defaultValues: {
      payerName: '',
      payerEmail: '',
      timezoneConfirm: false,
      consentimiento: false,
      commsAuthorization: false,
    },
  });

  async function onSubmit(values: ConfirmarFormValues) {
    setIsSubmitting(true);
    // TODO: Create appointment in DB → redirect to Wompi checkout
    console.log(values);
    // router.push(wompiCheckoutUrl);
    setIsSubmitting(false);
  }

  const formattedDate = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-10 sm:pb-16 sm:pt-16">
      <div className="text-center">
        <p className="text-sm font-medium text-plum">Paso 6 de 6</p>
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">Confirmar y pagar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revisa los detalles de tu cita antes de proceder al pago.
        </p>
      </div>

      {/* Resumen de la cita */}
      <Card className="mt-8 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-grape">Resumen de tu cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">{hora} hrs — 60 minutos</span>
          </div>
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 shrink-0 text-plum" />
            <span className="text-sm">Sesión online vía Google Meet</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-grape">Total a pagar</span>
            <span className="text-lg font-bold text-grape">$80.000 COP</span>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de pago */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            control={form.control}
            name="payerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" className="h-12 text-base" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="h-12 text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div className="space-y-4 rounded-xl bg-secondary/50 p-4">
            <h3 className="text-sm font-semibold text-grape">Antes de avanzar...</h3>

            <FormField
              control={form.control}
              name="timezoneConfirm"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 h-5 w-5"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <Label className="cursor-pointer text-sm font-normal leading-relaxed">
                      Confirmo que mi zona horaria está correcta en el agendamiento de mi sesión.
                    </Label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consentimiento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 h-5 w-5"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <Label className="cursor-pointer text-sm font-normal leading-relaxed">
                      Confirmo que he leído y acepto el{' '}
                      <a
                        href="/consentimiento"
                        target="_blank"
                        className="font-medium text-grape underline"
                      >
                        Consentimiento Informado de conAlma
                      </a>
                      , incluyendo el tratamiento de mis datos personales conforme a la ley, así
                      como su política de cancelación: las sesiones deben cancelarse con al menos 8
                      horas de anticipación para recibir reembolso. Cancelaciones con menos de 8
                      horas o no asistencia serán cobradas en su totalidad.
                    </Label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commsAuthorization"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 h-5 w-5"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <Label className="cursor-pointer text-sm font-normal leading-relaxed">
                      Autorizo a <strong>conAlma</strong> a enviarme mensajes de texto (SMS) y
                      comunicaciones transaccionales relacionadas con el servicio, incluyendo
                      confirmaciones y recordatorios de sesiones, notificaciones importantes y
                      mensajes de acompañamiento administrativo. La frecuencia de los mensajes puede
                      variar. Puedo responder STOP en cualquier momento para dejar de recibir
                      mensajes.
                    </Label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <a href="/terminos" className="underline" target="_blank">
              Términos de Servicio
            </a>{' '}
            |{' '}
            <a href="/privacidad" className="underline" target="_blank">
              Aviso de Privacidad
            </a>{' '}
            |{' '}
            <a href="/consentimiento" className="underline" target="_blank">
              Consentimiento Informado
            </a>
          </div>

          {/* Sticky button on mobile */}
          <div className="fixed inset-x-0 bottom-0 border-t border-border/40 bg-white p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full bg-jasmine text-base text-grape hover:bg-jasmine/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : 'Ir a pagar $80.000 COP'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
