/** Email del último intento de login (para reset de contraseña durante el flujo MFA). */
let lastEmail = '';

export function setLastSignInEmail(email: string): void {
  lastEmail = email.trim().toLowerCase();
}

export function getLastSignInEmail(): string {
  return lastEmail;
}
