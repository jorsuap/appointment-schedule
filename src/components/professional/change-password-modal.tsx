'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/lib/validations/professional-profile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

/**
 * Modal de cambio de contraseña obligatorio para el primer login del profesional.
 * Se renderiza como no-dismissable: no hay botón de cerrar ni se puede cerrar
 * haciendo clic fuera del modal.
 *
 * Validates: Requirement 1.5
 */
export function ChangePasswordModal() {
  const { update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/professional/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cambiar la contraseña');
      }

      setSuccess(true);
      toast.success('Contraseña actualizada correctamente');

      // Update session and force full page reload to re-evaluate server layout
      await update();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-plum/20">
            <Lock className="h-6 w-6 text-grape" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-grape">
            Cambiar contraseña
          </DialogTitle>
          <DialogDescription className="text-center">
            Debes cambiar tu contraseña temporal antes de continuar usando el portal.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Contraseña actualizada. Recargando...</p>
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Tu contraseña temporal"
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
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Repite tu nueva contraseña"
                      className="h-11 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-11 w-full bg-grape text-base text-white hover:bg-grape/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Actualizando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
