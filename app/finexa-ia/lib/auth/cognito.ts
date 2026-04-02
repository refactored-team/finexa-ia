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

export type SignInNext =
  | { kind: 'signed_in' }
  | { kind: 'needs_confirm_sign_up'; email: string }
  | { kind: 'needs_password_reset'; email: string }
  | { kind: 'needs_new_password' }
  | { kind: 'needs_verification_code'; channel: 'sms' | 'email' }
  | { kind: 'unsupported_challenge'; signInStep: string };

export type SignInResult = AuthResult<SignInNext>;

function notConfigured(): AuthResult<never> {
  return {
    ok: false,
    message:
      'Autenticación no configurada. Añadí EXPO_PUBLIC_COGNITO_USER_POOL_ID y EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID en tu entorno.',
    code: 'NotConfigured',
  };
}

function mapAuthError(err: unknown): AuthResult<never> {
  if (err instanceof AuthError) {
    const name = err.name;
    const messages: Record<string, string> = {
      NotAuthorizedException: 'Correo o contraseña incorrectos.',
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

function mapSignInOutput(
  out: { isSignedIn: boolean; nextStep: { signInStep: string } },
  email: string,
): SignInNext {
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
    return mapAuthError(e);
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

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  givenName: string,
): Promise<AuthResult<{ nextStep: SignUpNext }>> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const trimmed = email.trim().toLowerCase();
  try {
    const out = await signUp({
      username: trimmed,
      password,
      options: {
        userAttributes: {
          email: trimmed,
          given_name: givenName.trim(),
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
    return mapAuthError(e);
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
