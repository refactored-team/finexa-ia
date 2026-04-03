import {
  AuthError,
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

import {
  getAmplifyNativeUnavailableMessage,
  isAmplifyAuthConfigured,
} from '@/lib/amplify/configure';

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };

export type SignInNext =
  | { kind: 'signed_in' }
  | { kind: 'needs_confirm_sign_up'; email: string }
  | { kind: 'needs_password_reset'; email: string }
  | { kind: 'needs_new_password' }
  | { kind: 'unsupported_challenge'; signInStep: string };

export type SignInResult = AuthResult<SignInNext>;

export type SignUpProfile = {
  email: string;
  password: string;
  name: string;
  middle_name: string;
  birthdate: string;
  phone_number: string;
};

/** YYYY-MM-DD (Cognito birthdate). */
export function isValidBirthdate(value: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return false;
  const t = Date.parse(`${value}T12:00:00Z`);
  if (Number.isNaN(t)) return false;
  const d = new Date(t);
  const [y, m, day] = value.split('-').map(Number);
  return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === m && d.getUTCDate() === day;
}

/** E.164: + y 8–15 dígitos totales (Cognito suele aceptar +[country][number]). */
export function isValidPhoneE164(value: string): boolean {
  const s = value.trim();
  return /^\+[1-9]\d{6,14}$/.test(s);
}

function notConfigured(): AuthResult<never> {
  return {
    ok: false,
    message:
      'Autenticación no configurada. Añadí EXPO_PUBLIC_COGNITO_USER_POOL_ID y EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID en tu entorno.',
    code: 'NotConfigured',
  };
}

/** Expo Go no enlaza `@aws-amplify/react-native` (AmplifyRTNCore). */
function guardNativeAmplify(): AuthResult<never> | null {
  const msg = getAmplifyNativeUnavailableMessage();
  if (!msg) return null;
  return { ok: false, message: msg, code: 'ExpoGoNotSupported' };
}

/** Dónde ocurrió el error: el mismo código de Cognito puede significar cosas distintas. */
type AuthErrorContext = 'signInEmailPassword' | 'signUp' | 'default';

/** Nombres de error de Amplify que envuelven la causa real en `underlyingError`. */
const AMPLIFY_WRAPPER_NAMES = new Set([
  'SignInException',
  'OAuthSignInException',
  'Unknown',
]);

type ErrorChain = {
  /** De externo a interno (p. ej. SignInException → NotAuthorizedException). */
  names: string[];
  deepestMessage: string;
  recoverySuggestion?: string;
};

function collectErrorChain(err: unknown): ErrorChain {
  const names: string[] = [];
  let deepestMessage = '';
  let recoverySuggestion: string | undefined;
  const seen = new Set<unknown>();
  let cur: unknown = err;

  for (let i = 0; i < 8 && cur != null && !seen.has(cur); i++) {
    seen.add(cur);
    if (!(cur instanceof Error)) break;

    names.push(cur.name);
    deepestMessage = cur.message || deepestMessage;

    const withMeta = cur as Error & {
      underlyingError?: unknown;
      recoverySuggestion?: string;
    };
    if (typeof withMeta.recoverySuggestion === 'string' && !recoverySuggestion) {
      recoverySuggestion = withMeta.recoverySuggestion;
    }

    const next = withMeta.underlyingError;
    if (next == null) break;
    if (!AMPLIFY_WRAPPER_NAMES.has(cur.name)) break;
    cur = next;
  }

  if (names.length === 0 && err instanceof Error) {
    names.push(err.name);
    deepestMessage = err.message;
  }

  return { names, deepestMessage, recoverySuggestion };
}

/** Cognito / Amplify: preferir el código más interno con sufijo Exception u otros conocidos. */
function pickServiceErrorCode(names: string[]): string | undefined {
  for (let i = names.length - 1; i >= 0; i--) {
    const n = names[i];
    if (
      n.endsWith('Exception') ||
      n === 'NetworkError' ||
      n === 'TimeoutError' ||
      n === 'AbortError'
    ) {
      return n;
    }
  }
  return names.length ? names[names.length - 1] : undefined;
}

function mapAuthError(err: unknown, context: AuthErrorContext = 'default'): AuthResult<never> {
  const chain = collectErrorChain(err);
  const code = pickServiceErrorCode(chain.names);
  const notAuthorizedByContext: Record<AuthErrorContext, string> = {
    signInEmailPassword: 'Correo o contraseña incorrectos.',
    signUp:
      'Cognito rechazó el registro; no es el mismo caso que “contraseña débil” en pantalla. Revisá en AWS que el app client permita registro y, si usás Lambdas (pre sign-up), sus logs en CloudWatch. Si el correo ya existe, probá iniciar sesión.',
    default: 'No autorizado o datos rechazados. Verificá la información o volvé a intentar.',
  };

  const messages: Record<string, string> = {
    NotAuthorizedException: notAuthorizedByContext[context],
    UserNotConfirmedException: 'Confirmá tu correo con el código que te enviamos.',
    UsernameExistsException: 'Ya existe una cuenta con ese correo.',
    UserAlreadyAuthenticatedException: 'Ya hay una sesión activa.',
    InvalidPasswordException: 'La contraseña no cumple las reglas del servicio.',
    LimitExceededException: 'Demasiados intentos. Probá más tarde.',
    CodeMismatchException: 'El código no es válido.',
    ExpiredCodeException: 'El código expiró. Pedí uno nuevo.',
    InvalidParameterException: 'Revisá los datos ingresados.',
    NetworkError: 'Sin conexión o error de red. Probá de nuevo.',
    UserNotFoundException: 'No encontramos una cuenta con ese correo.',
    UserLambdaValidationException:
      'El registro fue rechazado por una validación en el servidor (Lambda de Cognito).',
    InvalidLambdaResponseException:
      'Error en la configuración del registro (respuesta inválida de Lambda en Cognito).',
    UnexpectedLambdaException: 'Error temporal del servidor al registrarte. Probá más tarde.',
    TooManyRequestsException: 'Demasiadas solicitudes. Esperá un momento e intentá de nuevo.',
    ResourceNotFoundException:
      'No se encontró el recurso de Cognito. Revisá EXPO_PUBLIC_COGNITO_USER_POOL_ID y EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID (región y valores correctos).',
    InvalidUserPoolConfigurationException:
      'La configuración del user pool en AWS no coincide con el flujo de inicio de sesión (por ejemplo, USER_PASSWORD_AUTH debe estar permitido en el app client).',
    ForbiddenException: 'Cognito rechazó la solicitud (permisos o política IAM/SMS). Revisá la consola de AWS.',
    InternalErrorException: 'Error interno de AWS. Probá de nuevo en unos minutos.',
    PasswordResetRequiredException: 'Tenés que restablecer la contraseña antes de entrar.',
    TooManyFailedAttemptsException: 'Demasiados intentos fallidos. Esperá e intentá de nuevo.',
    SignInException:
      'No se pudo completar el inicio de sesión. Revisá la configuración del user pool o volvé a intentar.',
    OAuthSignInException: 'Error en el inicio de sesión con el proveedor (Hosted UI / OAuth). Revisá la configuración del app client.',
    Unknown:
      'Ocurrió un error no identificado. Verificá conexión a internet y que las variables EXPO_PUBLIC_COGNITO_* estén bien cargadas.',
    TypeError: 'Falló la comunicación con el servidor (red o respuesta inesperada). Probá de nuevo.',
    TimeoutError: 'La solicitud tardó demasiado. Probá con mejor señal o más tarde.',
    AbortError: 'La solicitud fue cancelada. Intentá de nuevo.',
  };

  const mapped = code ? messages[code] : undefined;
  let message =
    mapped ??
    (code && chain.deepestMessage && !/unknown error/i.test(chain.deepestMessage)
      ? chain.deepestMessage
      : undefined) ??
    (code
      ? `No se pudo completar la operación (código: ${code}). Si persiste, contactá soporte.`
      : 'Ocurrió un error inesperado.');

  if (chain.recoverySuggestion && (code === 'SignInException' || code === 'Unknown' || !mapped)) {
    message = `${message}\n\n${chain.recoverySuggestion}`;
  }

  if (__DEV__) {
    const trace = chain.names.length ? chain.names.join(' → ') : String(err);
    console.warn('[Auth]', trace, chain.deepestMessage || err);
  }

  const isAuthError = err instanceof AuthError;
  return {
    ok: false,
    message,
    code: code ?? (isAuthError ? err.name : chain.names[0]),
  };
}

type SignInStepOutput = Awaited<ReturnType<typeof signIn>>;

function mapSignInOutput(out: SignInStepOutput, email: string): SignInNext {
  if (out.isSignedIn || out.nextStep.signInStep === 'DONE') {
    return { kind: 'signed_in' };
  }
  const step = out.nextStep.signInStep;
  switch (step) {
    case 'CONFIRM_SIGN_UP':
      return { kind: 'needs_confirm_sign_up', email };
    case 'RESET_PASSWORD':
      return { kind: 'needs_password_reset', email };
    case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
      return { kind: 'needs_new_password' };
    default:
      return { kind: 'unsupported_challenge', signInStep: step };
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const blocked = guardNativeAmplify();
  if (blocked) return blocked;
  const trimmed = email.trim().toLowerCase();
  try {
    const out = await signIn({ username: trimmed, password });
    return { ok: true, data: mapSignInOutput(out, trimmed) };
  } catch (e) {
    return mapAuthError(e, 'signInEmailPassword');
  }
}

export async function submitSignInNewPassword(newPassword: string): Promise<SignInResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const blocked = guardNativeAmplify();
  if (blocked) return blocked;
  try {
    const out = await confirmSignIn({ challengeResponse: newPassword });
    return { ok: true, data: mapSignInOutput(out, '') };
  } catch (e) {
    return mapAuthError(e);
  }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const blocked = guardNativeAmplify();
  if (blocked) return blocked;
  const trimmed = email.trim().toLowerCase();
  try {
    await resetPassword({ username: trimmed });
    return { ok: true, data: undefined };
  } catch (e) {
    return mapAuthError(e);
  }
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<AuthResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const blocked = guardNativeAmplify();
  if (blocked) return blocked;
  const trimmed = email.trim().toLowerCase();
  try {
    await confirmResetPassword({
      username: trimmed,
      confirmationCode: code.trim(),
      newPassword,
    });
    return { ok: true, data: undefined };
  } catch (e) {
    return mapAuthError(e);
  }
}

export type SignUpNext = 'CONFIRM_SIGN_UP' | 'DONE' | 'COMPLETE_AUTO_SIGN_IN';

export async function signUpWithProfile(
  profile: SignUpProfile,
): Promise<AuthResult<{ nextStep: SignUpNext }>> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const blocked = guardNativeAmplify();
  if (blocked) return blocked;
  const email = profile.email.trim().toLowerCase();
  const phone = profile.phone_number.trim();
  try {
    const out = await signUp({
      username: email,
      password: profile.password,
      options: {
        userAttributes: {
          email,
          name: profile.name.trim(),
          middle_name: profile.middle_name.trim(),
          birthdate: profile.birthdate.trim(),
          phone_number: phone,
        },
      },
    });

    const step = out.nextStep.signUpStep;
    if (step === 'CONFIRM_SIGN_UP') {
      return { ok: true, data: { nextStep: 'CONFIRM_SIGN_UP' as const } };
    }
    if (step === 'COMPLETE_AUTO_SIGN_IN') {
      return { ok: true, data: { nextStep: 'COMPLETE_AUTO_SIGN_IN' as const } };
    }
    return { ok: true, data: { nextStep: 'DONE' as const } };
  } catch (e) {
    return mapAuthError(e, 'signUp');
  }
}

export async function confirmSignUpCode(email: string, code: string): Promise<AuthResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const blocked = guardNativeAmplify();
  if (blocked) return blocked;
  const trimmed = email.trim().toLowerCase();
  try {
    await confirmSignUp({ username: trimmed, confirmationCode: code.trim() });
    return { ok: true, data: undefined };
  } catch (e) {
    return mapAuthError(e);
  }
}

export async function resendConfirmationCode(email: string): Promise<AuthResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const blocked = guardNativeAmplify();
  if (blocked) return blocked;
  const trimmed = email.trim().toLowerCase();
  try {
    await resendSignUpCode({ username: trimmed });
    return { ok: true, data: undefined };
  } catch (e) {
    return mapAuthError(e);
  }
}

/** Cierra sesión en Cognito y limpia tokens locales. Sin `guardNativeAmplify`: debe poder ejecutarse en Expo Go. */
export async function signOutUser(): Promise<AuthResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  try {
    await signOut();
    return { ok: true, data: undefined };
  } catch (e) {
    return mapAuthError(e);
  }
}

export async function hasAuthenticatedUser(): Promise<boolean> {
  if (!isAmplifyAuthConfigured()) return false;
  if (getAmplifyNativeUnavailableMessage()) return false;
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
