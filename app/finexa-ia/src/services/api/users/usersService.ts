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

/**
 * Crea o actualiza el usuario interno (misma BD que ms-plaid).
 * Llamar antes de link-token para que exista la fila en `users`.
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
