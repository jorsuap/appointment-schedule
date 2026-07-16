'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/admin',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' };
    }
    throw error; // Re-throw redirect errors (they're expected)
  }
}
