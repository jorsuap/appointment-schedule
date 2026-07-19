'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/admin',
    });
  } catch (error) {
    // NextAuth throws a NEXT_REDIRECT "error" on successful login — re-throw it
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' };
    }
    throw error;
  }
}
