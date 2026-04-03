/** Email del último intento de login (p. ej. confirmación o reset durante el flujo de sign-in). */
let lastEmail = '';

export function setLastSignInEmail(email: string): void {
  lastEmail = email.trim().toLowerCase();
}

export function getLastSignInEmail(): string {
  return lastEmail;
}
