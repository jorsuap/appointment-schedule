'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const emergenciaSchema = z.object({
  emergencyName: z.string().min(3, 'Ingresa el nombre del contacto'),
  emergencyRelation: z.string().min(1, 'Selecciona la relación'),
  emergencyPhone: z
    .string()
    .min(7, 'Ingresa un teléfono válido')
    .max(15, 'Máximo 15 dígitos')
    .regex(/^\d+$/, 'Solo se permiten números'),
  emergencyCountry: z.string().min(1, 'Selecciona el país'),
});

type EmergenciaFormValues = z.infer<typeof emergenciaSchema>;

const relations = [
  'Pareja',
  'Madre',
  'Padre',
  'Hermano/a',
  'Hijo/a',
  'Amigo/a',
  'Otro familiar',
  'Otro',
];

export default function EmergenciaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicioId = searchParams.get('servicio');

  const form = useForm<EmergenciaFormValues>({
    resolver: zodResolver(emergenciaSchema),
    defaultValues: {
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
      emergencyCountry: '',
    },
  });

  const { isValid } = form.formState;

  function onSubmit(values: EmergenciaFormValues) {
    console.log(values);
    router.push(`/agendar/profesional?servicio=${servicioId}`);
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
        <p className="text-sm font-medium text-plum">Paso 3 de 6</p>
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">
          Contacto de emergencia
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Por tu seguridad, necesitamos los datos de una persona de confianza a quien podamos
          contactar en caso de emergencia.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
          className="mt-8 space-y-5"
        >
          <FormField
            control={form.control}
            name="emergencyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del contacto"
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
            name="emergencyRelation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relación *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="¿Qué relación tienen?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relations.map((r) => (
                      <SelectItem key={r} value={r} className="text-base">
                        {r}
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
            name="emergencyPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono *</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Número de teléfono"
                    className="h-12 text-base"
                    {...field}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País de residencia *</FormLabel>
                <FormControl>
                  <CountrySelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="País del contacto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
