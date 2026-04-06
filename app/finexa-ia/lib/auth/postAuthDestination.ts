import { plaidService } from '@/src/services/api/plaid/plaidService';
import {
  getInternalUserIdFromSession,
  syncInternalUserFromSession,
} from '@/src/services/api/users/usersService';

export type PostAuthHref = '/(tabs)/explore' | '/(onboarding)/link-bank';

/**
 * Tras tener sesión Cognito: sincroniza usuario interno (opcional), consulta Plaid y elige onboarding vs tabs.
 * Si falla el estado de Plaid, se asume no vinculado (link-bank).
 */
export async function getPostAuthDestination(options?: {
  skipSync?: boolean;
}): Promise<PostAuthHref> {
  if (!options?.skipSync) {
    await syncInternalUserFromSession();
  }
  const internalUserId = await getInternalUserIdFromSession();
  try {
    const { linked } = await plaidService.getPlaidLinkStatus(String(internalUserId));
    return linked ? '/(tabs)/explore' : '/(onboarding)/link-bank';
  } catch {
    return '/(onboarding)/link-bank';
  }
}
