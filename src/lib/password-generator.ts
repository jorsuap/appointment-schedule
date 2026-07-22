import { randomBytes } from 'crypto';

/**
 * Genera una contraseña temporal segura de mínimo 16 caracteres.
 * Usa crypto.randomBytes(12) codificado en base64url, produciendo exactamente 16 caracteres
 * con entropía de 96 bits — suficiente para credenciales temporales de primer inicio de sesión.
 */
export function generateTempPassword(): string {
  return randomBytes(12).toString('base64url');
}
