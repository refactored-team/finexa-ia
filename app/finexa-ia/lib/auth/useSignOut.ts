import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { router } from 'expo-router';

import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';
import { signOutUser } from '@/lib/auth/cognito';

/** Same flow as `AuthBackground` sign-out: Cognito sign-out, then `/login`, with loading + alerts. */
export function useSignOut() {
  const inFlight = useRef(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSigningOut(true);
    try {
      if (!isAmplifyAuthConfigured()) {
        router.replace('/login');
        return;
      }
      const result = await signOutUser();
      if (!result.ok) {
        Alert.alert('Cerrar sesión', result.message);
        return;
      }
      router.replace('/login');
    } finally {
      inFlight.current = false;
      setSigningOut(false);
    }
  }, []);

  return { signingOut, signOut };
}
