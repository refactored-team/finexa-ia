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

import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };

export type MfaMethod = 'SMS' | 'TOTP' | 'EMAIL';

export type SignInNext =
  | { kind: 'signed_in' }
  | { kind: 'needs_confirm_sign_up'; email: string }
  | { kind: 'needs_password_reset'; email: string }
  | { kind: 'needs_new_password' }
  | { kind: 'needs_verification_code'; channel: 'sms' | 'email' | 'totp' }
  | {
      kind: 'needs_mfa_selection';
      allowedMFATypes: MfaMethod[];
      isSetup: boolean;
    }
  | { kind: 'needs_totp_setup'; setupUri: string; sharedSecret: string }
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

/** Dónde ocurrió el error: el mismo código de Cognito puede significar cosas distintas. */
type AuthErrorContext = 'signInEmailPassword' | 'signUp' | 'default';

function mapAuthError(err: unknown, context: AuthErrorContext = 'default'): AuthResult<never> {
  if (err instanceof AuthError) {
    const name = err.name;
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
    };
    return {
      ok: false,
      message: messages[name] ?? err.message ?? 'No se pudo completar la operación.',
      code: name,
    };
  }
  if (err instanceof Error) {
    return { ok: false, message: err.message, code: err.name };
  }
  return { ok: false, message: 'Ocurrió un error inesperado.' };
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
    case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
      return { kind: 'needs_verification_code', channel: 'sms' };
    case 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE':
      return { kind: 'needs_verification_code', channel: 'email' };
    case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
      return { kind: 'needs_verification_code', channel: 'totp' };
    case 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION': {
      const allowed = (
        out.nextStep as { allowedMFATypes?: MfaMethod[] }
      ).allowedMFATypes;
      const list =
        allowed && allowed.length > 0 ? allowed : (['SMS', 'TOTP'] as MfaMethod[]);
      return { kind: 'needs_mfa_selection', allowedMFATypes: list, isSetup: false };
    }
    case 'CONTINUE_SIGN_IN_WITH_MFA_SETUP_SELECTION': {
      const allowed = (
        out.nextStep as { allowedMFATypes?: MfaMethod[] }
      ).allowedMFATypes;
      const list =
        allowed && allowed.length > 0 ? allowed : (['SMS', 'TOTP', 'EMAIL'] as MfaMethod[]);
      return { kind: 'needs_mfa_selection', allowedMFATypes: list, isSetup: true };
    }
    case 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP': {
      const ns = out.nextStep as {
        signInStep: 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP';
        totpSetupDetails: {
          sharedSecret: string;
          getSetupUri: (appName: string, accountName: string) => URL;
        };
      };
      const uri = ns.totpSetupDetails.getSetupUri('Finexa', email || 'Usuario').toString();
      return {
        kind: 'needs_totp_setup',
        setupUri: uri,
        sharedSecret: ns.totpSetupDetails.sharedSecret,
      };
    }
    default:
      return { kind: 'unsupported_challenge', signInStep: step };
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const trimmed = email.trim().toLowerCase();
  try {
    const out = await signIn({ username: trimmed, password });
    return { ok: true, data: mapSignInOutput(out, trimmed) };
  } catch (e) {
    return mapAuthError(e, 'signInEmailPassword');
  }
}

export async function submitSignInChallengeCode(code: string): Promise<SignInResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  try {
    const out = await confirmSignIn({ challengeResponse: code.trim() });
    return { ok: true, data: mapSignInOutput(out, '') };
  } catch (e) {
    return mapAuthError(e);
  }
}

export async function submitSignInMfaChoice(method: MfaMethod): Promise<SignInResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  try {
    const out = await confirmSignIn({ challengeResponse: method });
    return { ok: true, data: mapSignInOutput(out, '') };
  } catch (e) {
    return mapAuthError(e);
  }
}

export async function submitSignInNewPassword(newPassword: string): Promise<SignInResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  try {
    const out = await confirmSignIn({ challengeResponse: newPassword });
    return { ok: true, data: mapSignInOutput(out, '') };
  } catch (e) {
    return mapAuthError(e);
  }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
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
  const trimmed = email.trim().toLowerCase();
  try {
    await resendSignUpCode({ username: trimmed });
    return { ok: true, data: undefined };
  } catch (e) {
    return mapAuthError(e);
  }
}

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
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
