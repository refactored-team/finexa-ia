import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';
import { hasAuthenticatedUser } from '@/lib/auth/cognito';
import { getPostAuthDestination } from '@/lib/auth/postAuthDestination';
import { syncInternalUserFromSession } from '@/src/services/api/users/usersService';
import { Layout } from '@/constants/uiStyles';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [signedInHref, setSignedInHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAmplifyAuthConfigured()) {
        if (!cancelled) {
          setSignedIn(false);
          setReady(true);
        }
        return;
      }
      const ok = await hasAuthenticatedUser();
      if (!cancelled) {
        setSignedIn(ok);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !signedIn) {
      return;
    }
    let cancelled = false;
    setSignedInHref(null);
    (async () => {
      try {
        await syncInternalUserFromSession();
        const href = await getPostAuthDestination({ skipSync: true });
        if (!cancelled) {
          setSignedInHref(href);
        }
      } catch {
        if (!cancelled) {
          setSignedInHref('/(onboarding)/link-bank');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, signedIn]);

  if (!ready) {
    return (
      <View style={[Layout.flex1, Layout.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (signedIn) {
    if (signedInHref === null) {
      return (
        <View style={[Layout.flex1, Layout.center]}>
          <ActivityIndicator />
        </View>
      );
    }
    return <Redirect href={signedInHref} />;
  }

  return <Redirect href="/login" />;
}
