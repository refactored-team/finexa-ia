import { Alert } from 'react-native';

import type { Router } from 'expo-router';

import { requestPasswordReset, type SignInResult } from '@/lib/auth/cognito';
import { getLastSignInEmail } from '@/lib/auth/lastSignInContext';

type Ctx = {
  email: string;
  setLoading: (v: boolean) => void;
};

/**
 * Navega o muestra alertas según el resultado de signIn / confirmSignIn.
 * Cubre login, confirmación de cuenta, nueva contraseña obligatoria y reset por correo.
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
    case 'unsupported_challenge':
      Alert.alert(
        'Inicio de sesión',
        `Tu cuenta requiere un paso que esta app aún no soporta (${data.signInStep}). Revisá la configuración del pool en AWS o contactá soporte.`,
      );
      return;
  }
}
