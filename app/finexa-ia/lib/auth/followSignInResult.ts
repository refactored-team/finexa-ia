import { Alert } from 'react-native';

import type { Router } from 'expo-router';

import {
  requestPasswordReset,
  submitSignInMfaChoice,
  type SignInResult,
} from '@/lib/auth/cognito';
import { getLastSignInEmail } from '@/lib/auth/lastSignInContext';
import { clearPendingTotpSetup, setPendingTotpSetup } from '@/lib/auth/totpSetupStore';

type Ctx = {
  email: string;
  setLoading: (v: boolean) => void;
};

/**
 * Navega o muestra alertas según el resultado de signIn / confirmSignIn.
 * Reutilizable en login, selección MFA, código, nueva contraseña y TOTP setup.
 */
export async function followSignInResult(
  router: Router,
  result: SignInResult,
  ctx: Ctx,
): Promise<void> {
  const { setLoading } = ctx;
  const email = ctx.email.trim().toLowerCase() || getLastSignInEmail();

  if (!result.ok) {
    if (result.code === 'UserNotConfirmedException') {
      Alert.alert('Confirmá tu correo', result.message, [
        {
          text: 'Ir a confirmar',
          onPress: () =>
            router.push({
              pathname: '/confirm-signup',
              params: { email: email || getLastSignInEmail() },
            }),
        },
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert('Inicio de sesión', result.message);
    return;
  }

  const { data } = result;

  switch (data.kind) {
    case 'signed_in':
      clearPendingTotpSetup();
      router.replace('/(tabs)/home');
      return;
    case 'needs_confirm_sign_up':
      router.push({
        pathname: '/confirm-signup',
        params: { email: data.email },
      });
      return;
    case 'needs_password_reset': {
      const e = data.email || email;
      setLoading(true);
      const send = await requestPasswordReset(e);
      setLoading(false);
      if (!send.ok) {
        Alert.alert('Restablecer contraseña', send.message);
        return;
      }
      Alert.alert(
        'Revisá tu correo',
        'Te enviamos un código para definir una nueva contraseña.',
        [
          {
            text: 'Continuar',
            onPress: () =>
              router.replace({
                pathname: '/reset-password',
                params: { email: e },
              }),
          },
        ],
      );
      return;
    }
    case 'needs_new_password':
      router.push('/new-password');
      return;
    case 'needs_verification_code':
      router.push({
        pathname: '/sign-in-challenge',
        params: { channel: data.channel },
      });
      return;
    case 'needs_mfa_selection':
      if (data.allowedMFATypes.length === 1) {
        setLoading(true);
        const next = await submitSignInMfaChoice(data.allowedMFATypes[0]);
        setLoading(false);
        await followSignInResult(router, next, ctx);
        return;
      }
      router.push({
        pathname: '/mfa-select',
        params: {
          types: data.allowedMFATypes.join(','),
          isSetup: data.isSetup ? '1' : '0',
        },
      });
      return;
    case 'needs_totp_setup':
      setPendingTotpSetup({
        setupUri: data.setupUri,
        sharedSecret: data.sharedSecret,
      });
      router.push('/totp-setup');
      return;
    case 'unsupported_challenge':
      Alert.alert(
        'Inicio de sesión',
        `Tu cuenta requiere un paso que esta app aún no soporta (${data.signInStep}). Revisá la configuración del pool en AWS o contactá soporte.`,
      );
      return;
  }
}
