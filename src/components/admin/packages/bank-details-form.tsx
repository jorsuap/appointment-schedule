'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

import {
  bankDetailsSchema,
  type BankDetailsInput,
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
import { Switch } from '@/components/ui/switch';

interface BankDetail {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  alias: string | null;
  isActive: boolean;
}

interface BankDetailsFormProps {
  bankDetail?: BankDetail;
  onSuccess: () => void;
}

type BankDetailsFormValues = BankDetailsInput & { isActive: boolean };

/**
 * Form component for creating/editing bank details.
 * Uses React Hook Form + Zod validation.
 * POST to /api/admin/bank-details (create) or PUT to /api/admin/bank-details/[id] (edit).
 *
 * Validates: Requirements 6.1
 */
export function BankDetailsForm({ bankDetail, onSuccess }: BankDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!bankDetail;

  const form = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema) as never,
    defaultValues: {
      bankName: bankDetail?.bankName ?? '',
      accountType: bankDetail?.accountType ?? '',
      accountNumber: bankDetail?.accountNumber ?? '',
      accountHolder: bankDetail?.accountHolder ?? '',
      alias: bankDetail?.alias ?? '',
      isActive: bankDetail?.isActive ?? true,
    },
  });

  async function onSubmit(values: BankDetailsFormValues) {
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/admin/bank-details/${bankDetail.id}`
        : '/api/admin/bank-details';

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar los datos bancarios');
      }

      toast.success(
        isEditing
          ? 'Datos bancarios actualizados'
          : 'Datos bancarios creados',
      );

      if (!isEditing) {
        form.reset({
          bankName: '',
          accountType: '',
          accountNumber: '',
          accountHolder: '',
          alias: '',
          isActive: true,
        });
      }

      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al guardar los datos bancarios',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">Nombre del banco</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Bancolombia"
                    className="h-10 bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">Tipo de cuenta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ahorros"
                    className="h-10 bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">Número de cuenta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000-000000-00"
                    className="h-10 bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountHolder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">Titular</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del titular"
                    className="h-10 bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alias"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-grape">
                  Alias{' '}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nequi, Daviplata..."
                    className="h-10 bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      className="data-checked:bg-grape data-checked:border-grape"
                    />
                  </FormControl>
                  <FormLabel className="text-grape cursor-pointer !mt-0">
                    Activo
                  </FormLabel>
                </div>
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
              {isEditing ? 'Actualizar datos bancarios' : 'Crear datos bancarios'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
