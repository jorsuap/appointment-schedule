'use client';

import { useState, useEffect } from 'react';
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
import { useBookingStore } from '@/stores/booking-store';

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
  const servicioId = searchParams.get('servicio');
  const profesionalId = searchParams.get('profesional');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const bookingStore = useBookingStore();

  const form = useForm<ConfirmarFormValues>({
    resolver: zodResolver(confirmarSchema),
    defaultValues: {
      payerName: bookingStore.patientData?.fullName || '',
      payerEmail: bookingStore.patientData?.email || '',
      timezoneConfirm: false,
      consentimiento: false,
      commsAuthorization: false,
    },
  });

  const formattedDate = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  async function onSubmit(values: ConfirmarFormValues) {
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create appointment
      const appointmentRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingStore.patientData,
          ...bookingStore.evaluationData,
          ...bookingStore.emergencyData,
          professionalId: profesionalId,
          serviceId: servicioId,
          date: fecha,
          startTime: hora,
        }),
      });

      if (!appointmentRes.ok) {
        const err = await appointmentRes.json();
        throw new Error(err.error || 'Error al crear la cita');
      }

      const { appointment } = await appointmentRes.json();

      // 2. Create payment session
      const paymentRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          payerName: values.payerName,
          payerEmail: values.payerEmail,
        }),
      });

      if (!paymentRes.ok) {
        const err = await paymentRes.json();
        throw new Error(err.error || 'Error al crear el pago');
      }

      const paymentData = await paymentRes.json();

      // 3. Redirect to Wompi checkout
      const wompiUrl = new URL(paymentData.widgetUrl);
      wompiUrl.searchParams.set('public-key', paymentData.publicKey);
      wompiUrl.searchParams.set('currency', paymentData.currency);
      wompiUrl.searchParams.set('amount-in-cents', String(paymentData.amountInCents));
      wompiUrl.searchParams.set('reference', paymentData.reference);
      wompiUrl.searchParams.set('signature:integrity', paymentData.integritySignature);
      wompiUrl.searchParams.set('redirect-url', paymentData.redirectUrl);
      wompiUrl.searchParams.set('customer-data:email', paymentData.customerEmail);
      wompiUrl.searchParams.set('customer-data:full-name', paymentData.customerName);

      window.location.href = wompiUrl.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-10 sm:pb-16 sm:pt-16">
      <div className="text-center">
        <p className="text-sm font-medium text-plum">Paso 6 de 6</p>
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">Confirmar y pagar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revisa los detalles de tu cita antes de proceder al pago.
        </p>
      </div>

      {/* Resumen */}
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
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Form */}
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
                  <Input type="email" placeholder="correo@ejemplo.com" className="h-12 text-base" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div className="space-y-4 rounded-xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-grape">Antes de avanzar...</h3>

            <FormField
              control={form.control}
              name="timezoneConfirm"
              render={({ field }) => (
                <FormItem className="flex gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1 h-5 w-5 shrink-0 border-grape bg-white" />
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
                <FormItem className="flex gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1 h-5 w-5 shrink-0 border-grape bg-white" />
                  </FormControl>
                  <div className="flex-1">
                    <p className="text-sm font-normal leading-relaxed">
                      Confirmo que he leído y acepto el{' '}
                      <a href="/consentimiento" target="_blank" className="font-medium text-grape underline">
                        Consentimiento Informado de conAlma
                      </a>
                      , incluyendo el tratamiento de mis datos personales conforme a la ley, así como su política de cancelación: las sesiones deben cancelarse con al menos 8 horas de anticipación para recibir reembolso.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commsAuthorization"
              render={({ field }) => (
                <FormItem className="flex gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1 h-5 w-5 shrink-0 border-grape bg-white" />
                  </FormControl>
                  <div className="flex-1">
                    <p className="text-sm font-normal leading-relaxed">
                      Autorizo a <strong>conAlma</strong> a enviarme comunicaciones transaccionales relacionadas con el servicio. Puedo responder STOP en cualquier momento.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-border/40 bg-white p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full bg-jasmine text-base text-grape hover:bg-jasmine/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : 'Ir a pagar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
