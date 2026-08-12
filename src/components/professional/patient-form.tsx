'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Loader2,
  UserPlus,
  User,
  Heart,
  Phone,
  ShieldCheck,
} from 'lucide-react';

import {
  createPatientSchema,
  type CreatePatientInput,
} from '@/lib/validations/patient';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CountrySelect } from '@/components/shared/country-select';
import { DatePicker } from '@/components/shared/date-picker';

/**
 * Patient creation form for the professional portal.
 * Uses React Hook Form + Zod for client-side validation.
 * POSTs to /api/professional/patients and handles server errors.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.4, 6.5
 */
export function PatientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      fullName: '',
      email: '',
      dateOfBirth: '',
      country: '',
      isAdult: true,
      preferredName: '',
      reasonForVisit: '',
      recentFeelings: '',
      selfHarmRisk: false,
      currentTreatment: false,
      previousDiagnosis: '',
      desiredOutcome: '',
      additionalNotes: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      emergencyCountry: '',
      dataPrivacyConsent: false,
      commsConsent: false,
      informedConsent: false,
    },
  });

  async function onSubmit(data: CreatePatientInput) {
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/professional/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        if (res.status === 422 && json.details) {
          Object.entries(json.details).forEach(([field, messages]) => {
            form.setError(field as keyof CreatePatientInput, {
              message: (messages as string[])[0],
            });
          });
        } else {
          toast.error(
            json.error === 'NO_SERVICES'
              ? 'Configura al menos un servicio antes de agregar pacientes'
              : 'Error al crear el paciente. Intenta de nuevo.',
          );
        }
        return;
      }

      const { patient } = await res.json();
      toast.success(`Paciente ${patient.fullName} registrado exitosamente`);
      router.push('/profesional/pacientes');
    } catch {
      toast.error('Error de conexión. Verifica tu internet.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 p-4 lg:p-0"
      >
        {/* Section 1: Datos Personales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-grape">
              <User className="h-5 w-5" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre completo del paciente"
                        className="text-base"
                        {...field}
                      />
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
                    <FormLabel>Nombre preferido</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="¿Cómo prefiere que le llamen?"
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="paciente@correo.com"
                        className="text-base"
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
                        placeholder="Selecciona un país"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
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
                        placeholder="Selecciona fecha de nacimiento"
                        mode="birthdate"
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
                    <FormLabel>¿Es mayor de edad? *</FormLabel>
                    <Select
                      value={field.value ? 'si' : 'no'}
                      onValueChange={(v) => field.onChange(v === 'si')}
                    >
                      <FormControl>
                        <SelectTrigger className="text-base">
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
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Evaluación Emocional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-grape">
              <Heart className="h-5 w-5" />
              Evaluación Emocional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField
              control={form.control}
              name="reasonForVisit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de consulta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="¿Por qué busca acompañamiento?"
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
                  <FormLabel>Sentimientos recientes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="¿Cómo se ha sentido últimamente?"
                      className="min-h-[100px] text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="selfHarmRisk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Riesgo de autolesión?</FormLabel>
                    <Select
                      value={field.value ? 'si' : 'no'}
                      onValueChange={(v) => field.onChange(v === 'si')}
                    >
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>¿En tratamiento actualmente?</FormLabel>
                    <Select
                      value={field.value ? 'si' : 'no'}
                      onValueChange={(v) => field.onChange(v === 'si')}
                    >
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
            </div>

            <FormField
              control={form.control}
              name="previousDiagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico previo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="¿Tiene algún diagnóstico previo?"
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
                  <FormLabel>Resultado esperado</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="¿Qué espera lograr con el acompañamiento?"
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
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cualquier información adicional relevante"
                      className="min-h-[80px] text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3: Contacto de Emergencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-grape">
              <Phone className="h-5 w-5" />
              Contacto de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="emergencyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del contacto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre completo"
                        className="text-base"
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
                    <FormLabel>Relación</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Padre, Madre, Pareja"
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="emergencyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+57 300 000 0000"
                        className="text-base"
                        {...field}
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
                    <FormLabel>País del contacto</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecciona un país"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Consentimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-grape">
              <ShieldCheck className="h-5 w-5" />
              Consentimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="dataPrivacyConsent"
              render={({ field }) => (
                <FormItem className="flex gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 h-5 w-5 shrink-0"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-foreground">
                      El paciente acepta la{' '}
                      <span className="font-medium text-grape">
                        política de tratamiento de datos personales
                      </span>
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
                      className="mt-0.5 h-5 w-5 shrink-0"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-foreground">
                      El paciente autoriza comunicaciones transaccionales
                      (confirmaciones, recordatorios de citas)
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="informedConsent"
              render={({ field }) => (
                <FormItem className="flex gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 h-5 w-5 shrink-0"
                    />
                  </FormControl>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-foreground">
                      El paciente otorga consentimiento informado para el
                      proceso de acompañamiento
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="sticky bottom-0 border-t border-border/40 bg-white py-4 lg:static lg:border-0 lg:bg-transparent lg:py-0">
          <Button
            type="submit"
            className="h-12 w-full bg-grape text-base text-white hover:bg-grape/90 lg:w-auto lg:px-10"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando paciente...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar Paciente
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
