'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  let success = false;

  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    });
    success = true;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' };
    }
    // Check if it's a redirect (NextAuth sometimes throws these)
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      success = true;
    } else {
      return { error: 'Error inesperado. Intenta de nuevo.' };
    }
  }

  if (success) {
    redirect('/admin');
  }
}
