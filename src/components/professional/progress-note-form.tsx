'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

import {
  createProgressNoteSchema,
  type CreateProgressNoteInput,
} from '@/lib/validations/professional-profile';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Appointment {
  id: string;
  date: string;
  serviceName: string;
}

interface ProgressNoteFormProps {
  patientId: string;
  appointments: Appointment[];
  onNoteAdded: () => void;
}

/**
 * Form to add progress notes for a patient.
 * Includes textarea for content and optional appointment selector.
 * Submits POST to /api/professional/patients/[patientId]/notes.
 *
 * Validates: Requirement 8.3
 */
export function ProgressNoteForm({
  patientId,
  appointments,
  onNoteAdded,
}: ProgressNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateProgressNoteInput>({
    resolver: zodResolver(createProgressNoteSchema),
    defaultValues: {
      content: '',
      appointmentId: undefined,
    },
  });

  async function onSubmit(values: CreateProgressNoteInput) {
    setIsSubmitting(true);

    try {
      const body: Record<string, string> = { content: values.content };
      if (values.appointmentId) {
        body.appointmentId = values.appointmentId;
      }

      const res = await fetch(`/api/professional/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al agregar la nota');
      }

      toast.success('Nota agregada correctamente');
      form.reset({ content: '', appointmentId: undefined });
      onNoteAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agregar la nota');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-grape">Nota de progreso</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escribe la nota de progreso del paciente..."
                  className="min-h-[120px] resize-y text-base"
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <FormMessage />
                <span className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/5000
                </span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-grape">
                Cita asociada{' '}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <FormControl>
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder="Seleccionar cita..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {appointments.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id}>
                      {formatDate(apt.date)} — {apt.serviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Send className="mr-2 h-4 w-4" />
              Agregar nota
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
