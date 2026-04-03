import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

import { amplifyAsyncStorage } from '@/lib/amplify/asyncStorageAdapter';

const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '';
const userPoolClientId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? '';

let configured = false;

export function isAmplifyAuthConfigured(): boolean {
  return configured && Boolean(userPoolId && userPoolClientId);
}

/** `true` en la app genérica Expo Go (sin tus módulos nativos: Amplify, Plaid, etc.). */
export function isExpoGo(): boolean {
  if (Platform.OS === 'web') return false;
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** Instrucciones compartidas cuando hace falta un binario con nativos (Plaid, Amplify RTN, etc.). */
export function getExpoGoDevBuildInstructions(): string | null {
  if (!isExpoGo()) return null;
  return (
    'Expo Go no incluye el código nativo de Plaid ni de otros SDK de este proyecto.\n\n' +
    'Generá e instalá un development build:\n' +
    '1) npx expo prebuild\n' +
    '2) npx expo run:ios (o npx expo run:android)\n' +
    '3) npm run start:dev\n\n' +
    'Abrí la app Finexa desde el simulador o el teléfono, no desde Expo Go.'
  );
}

/**
 * Expo Go no incluye el nativo `AmplifyRTNCore` de `@aws-amplify/react-native`.
 * En ese entorno Cognito/Amplify v6 falla al iniciar sesión hasta usar un development build.
 */
export function getAmplifyNativeUnavailableMessage(): string | null {
  if (!isExpoGo()) return null;
  return (
    'AWS Amplify necesita un development build: Expo Go no incluye el módulo nativo @aws-amplify/react-native.\n\n' +
    '1) npx expo prebuild\n' +
    '2) npx expo run:ios (o npx expo run:android)\n' +
    '3) npm run start:dev\n\n' +
    'Abrí la app Finexa instalada en simulador o dispositivo, no la de Expo Go.'
  );
}

/**
 * Configura Amplify Auth (Cognito). Requiere EXPO_PUBLIC_COGNITO_USER_POOL_ID y
 * EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID en `.env` (ver `.env.example`).
 */
export function configureAmplify(): void {
  if (!userPoolId || !userPoolClientId) {
    if (__DEV__) {
      console.warn(
        '[Amplify] Faltan EXPO_PUBLIC_COGNITO_USER_POOL_ID o EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID. El auth con Cognito no funcionará hasta configurarlas.',
      );
    }
    return;
  }

  cognitoUserPoolsTokenProvider.setKeyValueStorage(amplifyAsyncStorage);

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          email: true,
        },
      },
    },
  });

  configured = true;

  if (__DEV__) {
    const expoGo = getAmplifyNativeUnavailableMessage();
    if (expoGo) {
      console.warn('[Amplify]', expoGo.replace(/\n\n/g, ' '));
    }
  }
}
