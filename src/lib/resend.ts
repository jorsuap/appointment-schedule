import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');

export const FROM_EMAIL = 'conAlma <citas@conalma.care>';
