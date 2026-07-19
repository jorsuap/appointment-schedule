'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    });

    if (result?.error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      setIsPending(false);
    } else if (result?.ok) {
      router.push('/admin');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lilac px-4">
      <Card className="w-full max-w-sm border-border/40">
        <CardHeader className="text-center">
          <span className="text-2xl font-bold text-grape">conAlma</span>
          <CardTitle className="mt-2 text-lg text-grape">Panel de administración</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <Label className="text-sm">Correo electrónico</Label>
              <Input
                name="email"
                type="email"
                placeholder="admin@conalma.co"
                className="mt-1 h-11 text-base"
                required
              />
            </div>

            <div>
              <Label className="text-sm">Contraseña</Label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                className="mt-1 h-11 text-base"
                required
              />
            </div>

            <Button type="submit" className="h-11 w-full text-base" disabled={isPending}>
              {isPending ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
