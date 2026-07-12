'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CountrySelect } from '@/components/shared/country-select';
import { DatePicker } from '@/components/shared/date-picker';

const datosSchema = z.object({
  fullName: z.string().min(3, 'Ingresa tu nombre completo'),
  preferredName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Selecciona tu fecha de nacimiento'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  country: z.string().min(1, 'Selecciona tu país de residencia'),
  isAdult: z.enum(['si', 'no'], { message: 'Selecciona una opción' }),
  dataPrivacyConsent: z.boolean().refine((v) => v === true, {
    message: 'Debes aceptar la política de tratamiento de datos',
  }),
  commsConsent: z.boolean().refine((v) => v === true, {
    message: 'Debes autorizar las comunicaciones transaccionales',
  }),
});

type DatosFormValues = z.infer<typeof datosSchema>;

export default function DatosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicioId = searchParams.get('servicio');

  const form = useForm<DatosFormValues>({
    resolver: zodResolver(datosSchema),
    defaultValues: {
      fullName: '',
      preferredName: '',
      dateOfBirth: '',
      email: '',
      country: '',
      dataPrivacyConsent: false,
      commsConsent: false,
    },
  });

  const { isValid } = form.formState;

  function onSubmit(values: DatosFormValues) {
    // TODO: Save to Zustand booking store
    console.log(values);
    router.push(`/agendar/evaluacion?servicio=${servicioId}`);
  }

  function handleInvalidSubmit() {
    // Scroll to first error field
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
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">Cuéntanos sobre ti</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta información nos ayuda a preparar un espacio personalizado para ti.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
          className="mt-8 space-y-5"
        >
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre completo" className="h-12 text-base" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>¿Cómo te gusta que te llamen?</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre o apodo preferido"
                    className="h-12 text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento *</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecciona tu fecha de nacimiento"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    className="h-12 text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País de residencia *</FormLabel>
                <FormControl>
                  <CountrySelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecciona tu país"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAdult"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ¿La persona que recibirá la atención es mayor de 18 años? *
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="si" className="text-base">
                      Sí
                    </SelectItem>
                    <SelectItem value="no" className="text-base">
                      No
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Consentimientos — layout fix */}
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-semibold text-grape">Antes de continuar</h3>

            <div className="space-y-5">
              <FormField
                control={form.control}
                name="dataPrivacyConsent"
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
                        Acepto la{' '}
                        <a
                          href="/privacidad"
                          className="font-medium text-grape underline"
                          target="_blank"
                        >
                          política de tratamiento de datos personales
                        </a>{' '}
                        de conAlma, conforme a la legislación vigente.
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commsConsent"
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
                        Autorizo a <strong>conAlma</strong> a enviarme comunicaciones
                        transaccionales (confirmaciones, recordatorios de citas y mensajes
                        relacionados con el servicio) a través de correo electrónico o WhatsApp.
                        Puedo retirar este consentimiento en cualquier momento.
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
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
