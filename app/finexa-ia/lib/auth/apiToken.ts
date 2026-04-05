import { fetchAuthSession } from 'aws-amplify/auth';

import {
  getAmplifyNativeUnavailableMessage,
  isAmplifyAuthConfigured,
} from '@/lib/amplify/configure';

/**
 * JWT de Cognito para el authorizer JWT del API Gateway (audience = app client id → ID token).
 */
export async function getCognitoIdTokenForApi(options?: {
  forceRefresh?: boolean;
}): Promise<string | null> {
  if (!isAmplifyAuthConfigured()) return null;
  if (getAmplifyNativeUnavailableMessage()) return null;
  try {
    const session = await fetchAuthSession({ forceRefresh: options?.forceRefresh });
    const raw = session.tokens?.idToken?.toString();
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}
