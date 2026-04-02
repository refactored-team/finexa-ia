/** Datos efímeros para la pantalla de alta TOTP (URI largo). */
let pending: { setupUri: string; sharedSecret: string } | undefined;

export function setPendingTotpSetup(payload: { setupUri: string; sharedSecret: string }): void {
  pending = payload;
}

export function getPendingTotpSetup(): { setupUri: string; sharedSecret: string } | undefined {
  return pending;
}

export function clearPendingTotpSetup(): void {
  pending = undefined;
}
