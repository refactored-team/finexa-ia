import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

import { amplifyAsyncStorage } from '@/lib/amplify/asyncStorageAdapter';

const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '';
const userPoolClientId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? '';

let configured = false;

export function isAmplifyAuthConfigured(): boolean {
  return configured && Boolean(userPoolId && userPoolClientId);
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
}
