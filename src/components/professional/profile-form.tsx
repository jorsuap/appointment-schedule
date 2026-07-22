'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, User, Mail, DollarSign, Percent } from 'lucide-react';

import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/professional-profile';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProfessionalProfile {
  id: string;
  name: string;
  email: string;
  specialty: string;
  description: string | null;
  traits: string[];
  photoUrl: string | null;
  tariff: { price: number; commission: number };
  googleCalendarConnected: boolean;
  googleCalendarEmail: string | null;
}

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

/**
 * Profile form for the professional portal.
 * Displays readonly fields as plain text and editable fields via React Hook Form.
 * Submits PUT to /api/professional/profile.
 *
 * Validates: Requirements 3.1, 3.2
 */
export function ProfileForm() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      specialty: '',
      description: '',
      traits: [],
      photoUrl: '',
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/professional/profile');
        if (!res.ok) {
          throw new Error('Error al cargar el perfil');
        }
        const data: ProfessionalProfile = await res.json();
        setProfile(data);

        // Reset form with fetched data
        form.reset({
          specialty: data.specialty || '',
          description: data.description || '',
          traits: data.traits || [],
          photoUrl: data.photoUrl || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [form]);

  async function onSubmit(values: UpdateProfileInput) {
    setIsSubmitting(true);

    try {
      // Parse traits from comma-separated string if needed
      const payload: UpdateProfileInput = {
        ...values,
        photoUrl: values.photoUrl || null,
        description: values.description || null,
      };

      const res = await fetch('/api/professional/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar el perfil');
      }

      const updated: ProfessionalProfile = await res.json();
      setProfile(updated);
      toast.success('Perfil actualizado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Readonly fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-grape">Información de cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Estos datos son gestionados por el administrador y no pueden ser modificados.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadonlyField
              icon={<User className="h-4 w-4 text-plum" />}
              label="Nombre"
              value={profile.name}
            />
            <ReadonlyField
              icon={<Mail className="h-4 w-4 text-plum" />}
              label="Email"
              value={profile.email}
            />
            <ReadonlyField
              icon={<DollarSign className="h-4 w-4 text-plum" />}
              label="Tarifa por sesión"
              value={formatCOP.format(profile.tariff.price)}
            />
            <ReadonlyField
              icon={<Percent className="h-4 w-4 text-plum" />}
              label="Comisión"
              value={`${profile.tariff.commission}%`}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Editable fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-grape">Perfil público</CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta información es visible para los pacientes en la plataforma de agendamiento.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-grape">Especialidad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Psicología clínica, Terapia de pareja"
                        className="h-11 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-grape">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cuéntale a tus pacientes sobre tu enfoque y experiencia..."
                        className="min-h-[120px] resize-y text-base"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="traits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-grape">Características de estilo</FormLabel>
                    <FormControl>
                      <TraitsInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Escribe una característica y presiona Enter o coma para agregarla.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-grape">URL de foto de perfil</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://ejemplo.com/mi-foto.jpg"
                        className="h-11 text-base"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full bg-grape text-base text-white hover:bg-grape/90 sm:w-auto sm:px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Readonly field displayed as plain text with icon and label.
 */
function ReadonlyField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

/**
 * Traits input component with chip/badge display.
 * Allows adding traits via Enter or comma, and removing them by clicking X.
 */
function TraitsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (traits: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  function addTrait(raw: string) {
    const trait = raw.trim();
    if (trait && !value.includes(trait)) {
      onChange([...value, trait]);
    }
    setInputValue('');
  }

  function removeTrait(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTrait(inputValue);
    }
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTrait(value.length - 1);
    }
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {value.map((trait, index) => (
        <Badge
          key={`${trait}-${index}`}
          className="gap-1 bg-plum/20 text-grape hover:bg-plum/30"
        >
          {trait}
          <button
            type="button"
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-grape/20"
            onClick={() => removeTrait(index)}
            aria-label={`Eliminar ${trait}`}
          >
            ×
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addTrait(inputValue);
        }}
        placeholder={value.length === 0 ? 'Ej: Empática, Directa, Creativa' : ''}
        className="min-w-[120px] flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-11 animate-pulse rounded bg-muted" />
            </div>
          ))}
          <div className="h-11 w-40 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
