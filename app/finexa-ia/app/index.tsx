import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';
import { hasAuthenticatedUser } from '@/lib/auth/cognito';
import { Layout } from '@/constants/uiStyles';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

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

  if (!ready) {
    return (
      <View style={[Layout.flex1, Layout.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (signedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}
