/**
 * Política alineada con el default típico de Cognito User Pools (consola AWS).
 * Si cambiaste mínimo / requisitos en el pool, ajustá estos valores para que coincidan.
 */
export const COGNITO_LIKE_PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  /** Cognito acepta varios símbolos; "no letra ni dígito" cubre el caso usual. */
  requireSymbols: true,
} as const;

export type CognitoLikePasswordPolicy = typeof COGNITO_LIKE_PASSWORD_POLICY;

export type PasswordRuleCheck = {
  id: string;
  ok: boolean;
  /** Texto corto para la lista en UI */
  label: string;
  /** Mensaje si falta (para alertas) */
  missingMessage: string;
};

export function evaluatePasswordAgainstPolicy(
  password: string,
  policy: CognitoLikePasswordPolicy = COGNITO_LIKE_PASSWORD_POLICY,
): PasswordRuleCheck[] {
  const checks: PasswordRuleCheck[] = [
    {
      id: 'length',
      ok: password.length >= policy.minLength,
      label: `Al menos ${policy.minLength} caracteres`,
      missingMessage: `al menos ${policy.minLength} caracteres`,
    },
  ];
  if (policy.requireUppercase) {
    checks.push({
      id: 'upper',
      ok: /[A-Z]/.test(password),
      label: 'Una letra mayúscula (A-Z)',
      missingMessage: 'una letra mayúscula',
    });
  }
  if (policy.requireLowercase) {
    checks.push({
      id: 'lower',
      ok: /[a-z]/.test(password),
      label: 'Una letra minúscula (a-z)',
      missingMessage: 'una letra minúscula',
    });
  }
  if (policy.requireNumbers) {
    checks.push({
      id: 'digit',
      ok: /\d/.test(password),
      label: 'Un número (0-9)',
      missingMessage: 'un número',
    });
  }
  if (policy.requireSymbols) {
    checks.push({
      id: 'symbol',
      ok: /[^A-Za-z0-9]/.test(password),
      label: 'Un símbolo (ej. ! @ # $ %)',
      missingMessage: 'un símbolo especial',
    });
  }
  return checks;
}

export function passwordMeetsCognitoLikePolicy(password: string): boolean {
  return evaluatePasswordAgainstPolicy(password).every((c) => c.ok);
}

export function passwordMissingPartsSpanish(password: string): string {
  const missing = evaluatePasswordAgainstPolicy(password)
    .filter((c) => !c.ok)
    .map((c) => c.missingMessage);
  if (missing.length === 0) return '';
  return missing.join(', ');
}
