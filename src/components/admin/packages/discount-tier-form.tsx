'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

import {
  discountTierSchema,
  type DiscountTierInput,
} from '@/lib/validations/packages';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DiscountTier {
  id: string;
  minSessions: number;
  maxSessions: number;
  discountPerSession: number;
}

interface DiscountTierFormProps {
  tier?: DiscountTier;
  onSuccess: () => void;
}

/**
 * Form component for creating/editing discount tiers.
 * Uses React Hook Form + Zod validation.
 * POST to /api/admin/discount-tiers (create) or PUT to /api/admin/discount-tiers/[id] (edit).
 *
 * Validates: Requirements 2.1
 */
export function DiscountTierForm({ tier, onSuccess }: DiscountTierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!tier;

  const form = useForm<DiscountTierInput>({
    resolver: zodResolver(discountTierSchema),
    defaultValues: {
      minSessions: tier?.minSessions ?? 2,
      maxSessions: tier?.maxSessions ?? 2,
      discountPerSession: tier?.discountPerSession ?? 0,
    },
  });

  async function onSubmit(values: DiscountTierInput) {
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/admin/discount-tiers/${tier.id}`
        : '/api/admin/discount-tiers';

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar el tramo de descuento');
      }

      toast.success(
        isEditing
          ? 'Tramo de descuento actualizado'
          : 'Tramo de descuento creado',
      );

      if (!isEditing) {
        form.reset({ minSessions: 2, maxSessions: 2, discountPerSession: 0 });
      }

      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al guardar el tramo de descuento',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="minSessions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">Mín. sesiones</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2}
                    placeholder="2"
                    className="h-10 bg-white"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxSessions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">Máx. sesiones</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2}
                    placeholder="4"
                    className="h-10 bg-white"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountPerSession"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">
                  Descuento/sesión (COP)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="5000"
                    className="h-10 bg-white"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="h-10 bg-grape text-white hover:bg-grape/90"
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
              {isEditing ? 'Actualizar tramo' : 'Crear tramo'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
