import {
  AuthError,
  confirmSignUp,
  getCurrentUser,
  resendSignUpCode,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };

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

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isAmplifyAuthConfigured()) return notConfigured();
  const trimmed = email.trim().toLowerCase();
  try {
    await signIn({ username: trimmed, password });
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
