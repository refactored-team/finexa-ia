import { fetchAuthSession } from 'aws-amplify/auth';

import apiClient from '../apiClient';

/** Respuesta de POST /ms-users/v1/users (envelope apiresult). */
export type UpsertUserResponse = {
  ok: boolean;
  data: {
    id: number;
    cognito_sub: string;
    email?: string;
    created_at: string;
    updated_at: string;
  };
};

async function getCognitoSubAndEmailFromSession(): Promise<{ sub: string; email?: string }> {
  const session = await fetchAuthSession();
  const payload = session.tokens?.idToken?.payload;
  const sub = payload?.sub;
  if (typeof sub !== 'string' || sub.length === 0) {
    throw new Error('No hay sesión Cognito o falta el sub en el token');
  }
  const email = typeof payload?.email === 'string' ? payload.email : undefined;
  return { sub, email };
}

/**
 * POST /ms-users/v1/users con el usuario actual (ID token en apiClient).
 * Llamar tras login o registro con sesión para persistir fila en Postgres.
 */
export async function syncInternalUserFromSession(): Promise<number> {
  const { sub, email } = await getCognitoSubAndEmailFromSession();
  return upsertCurrentUser(sub, email);
}

/**
 * Obtiene el id interno sin POST (GET by cognito_sub). Usar en link-bank tras sync en auth.
 */
export async function getInternalUserIdFromSession(): Promise<number> {
  const { sub } = await getCognitoSubAndEmailFromSession();
  const response = await apiClient.get<UpsertUserResponse>('/ms-users/v1/users/by-cognito', {
    params: { cognito_sub: sub },
  });
  const id = response.data?.data?.id;
  if (typeof id !== 'number') {
    throw new Error('Respuesta inválida al buscar usuario por cognito_sub');
  }
  return id;
}

/**
 * Crea o actualiza el usuario interno (misma BD que ms-plaid).
 */
export async function upsertCurrentUser(cognitoSub: string, email?: string | null): Promise<number> {
  const response = await apiClient.post<UpsertUserResponse>('/ms-users/v1/users', {
    cognito_sub: cognitoSub,
    ...(email ? { email } : {}),
  });
  const id = response.data?.data?.id;
  if (typeof id !== 'number') {
    throw new Error('Invalid upsert user response');
  }
  return id;
}
