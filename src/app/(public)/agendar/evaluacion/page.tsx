'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useBookingStore, type EvaluationData } from '@/stores/booking-store';

const evaluacionSchema = z.object({
  reasonForVisit: z.string().min(1, 'Este campo es requerido'),
  recentFeelings: z.string().min(1, 'Este campo es requerido'),
  selfHarmRisk: z.enum(['si', 'no'], { message: 'Selecciona una opción' }),
  currentTreatment: z.enum(['si', 'no'], { message: 'Selecciona una opción' }),
  previousDiagnosis: z.string().optional(),
  desiredOutcome: z.string().min(1, 'Selecciona al menos una opción'),
  additionalNotes: z.string().optional(),
  informedConsent: z.boolean().refine((v) => v === true, {
    message: 'Debes confirmar que comprendes el alcance del servicio',
  }),
});

type EvaluacionFormValues = z.infer<typeof evaluacionSchema>;

const desiredOutcomeOptions = [
  'Sentirme escuchado/a o comprendido/a',
  'Salir con ideas claras o herramientas',
  'Entender mejor lo que me pasa',
  'Tener un espacio seguro para hablar',
  'No lo sé aún',
];

export default function EvaluacionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicioId = searchParams.get('servicio');

  const form = useForm<EvaluacionFormValues>({
    resolver: zodResolver(evaluacionSchema),
    defaultValues: {
      reasonForVisit: '',
      recentFeelings: '',
      previousDiagnosis: '',
      desiredOutcome: '',
      additionalNotes: '',
      informedConsent: false,
    },
  });

  const { isValid } = form.formState;

  const { setEvaluationData } = useBookingStore();

  function onSubmit(values: EvaluacionFormValues) {
    setEvaluationData(values as EvaluationData);
    router.push(`/agendar/emergencia?servicio=${servicioId}`);
  }

  function handleInvalidSubmit() {
    setTimeout(() => {
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstError as HTMLElement).focus();
      }
    }, 100);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-10 sm:pb-16 sm:pt-16">
      <div className="text-center">
        <p className="text-sm font-medium text-plum">Paso 2 de 6</p>
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">
          Queremos conocerte mejor
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tus respuestas son confidenciales y ayudan a tu especialista a prepararse para tu sesión.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
          className="mt-8 space-y-5"
        >
          <FormField
            control={form.control}
            name="reasonForVisit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Qué te trae por aquí en este momento? *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Cuéntanos brevemente..."
                    className="min-h-[100px] text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recentFeelings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿Cómo describirías cómo te has sentido en las últimas semanas? *
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe cómo te has sentido..."
                    className="min-h-[100px] text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selfHarmRisk"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿En las últimas semanas has intentado hacerte daño o ideado un plan para hacerlo? *
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-white text-base">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="no" className="text-base">
                      No
                    </SelectItem>
                    <SelectItem value="si" className="text-base">
                      Sí
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentTreatment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿Actualmente estás recibiendo algún tipo de tratamiento o acompañamiento
                  psicológico? *
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-white text-base">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="no" className="text-base">
                      No
                    </SelectItem>
                    <SelectItem value="si" className="text-base">
                      Sí
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="previousDiagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿Alguna vez has recibido algún diagnóstico de salud física o mental que consideres
                  importante compartir?
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Si no aplica, puedes dejarlo vacío"
                    className="min-h-[80px] text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="desiredOutcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿Qué te gustaría encontrar principalmente en el acompañamiento? *
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-white text-base">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                    {desiredOutcomeOptions.map((option) => (
                      <SelectItem
                        key={option}
                        value={option}
                        className="text-sm sm:text-base"
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿Hay algo que te gustaría que tu especialista sepa antes de la primera sesión?
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Opcional — cualquier detalle adicional"
                    className="min-h-[80px] text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Consentimiento informado — fixed layout */}
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
            <FormField
              control={form.control}
              name="informedConsent"
              render={({ field }) => (
                <FormItem className="flex gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1 h-5 w-5 shrink-0"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-foreground">
                      Confirmo que entiendo que este servicio ofrece{' '}
                      <strong>acompañamiento emocional online</strong> y que no
                      constituye atención de urgencias, tratamiento médico, psiquiátrico ni
                      reemplaza la atención presencial especializada cuando sea necesaria.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Sticky button on mobile */}
          <div className="fixed inset-x-0 bottom-0 border-t border-border/40 bg-white p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
            <Button
              type="submit"
              size="lg"
              className={`h-12 w-full text-base transition-opacity ${!isValid ? 'opacity-60' : ''}`}
            >
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
