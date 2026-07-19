'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' };
    }
    // NextAuth may throw redirect errors on success
    if ((error as Error)?.message?.includes('NEXT_REDIRECT') || 
        (error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      return { success: true };
    }
    return { error: 'Error inesperado. Intenta de nuevo.' };
  }
}
