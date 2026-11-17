import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../../auth';
import { Glass } from '../../components/Glass';
import { Still } from '../../components/Still';
import { ActionButton, Body, Heading } from '../../components/ui';
import { supabase } from '../../supabase';
import { useTrips } from '../../store';
import { useColors } from '../../theme';

// Opened from an invite link: joins the trip, then shows it.
export default function Join() {
  const c = useColors();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const session = useSession();
  const { reload, setActiveId } = useTrips();
  const [error, setError] = useState('');

  useEffect(() => {
    if (session.status !== 'signedIn') return;
    supabase.rpc('join_trip', { token }).then(async ({ data, error: e }) => {
      if (e || !data) return setError(e?.message ?? 'This invite link is not valid.');
      await reload();
      setActiveId(data);
      router.replace({ pathname: '/trip/[id]', params: { id: data } });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status, token]);

  return (
    <View style={{ flex: 1, backgroundColor: c.page, justifyContent: 'center', padding: 16 }}>
      <Still />
      <Glass pad={22} style={{ maxWidth: 440, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 12 }}>
          <Heading size={30}>Join a trip</Heading>
          {session.status === 'signedOut' ? (
            <>
              <Body dim>Sign in or create an account, then open the invite link again.</Body>
              <ActionButton label="Go to sign in" icon="login" onPress={() => router.replace('/')} />
            </>
          ) : error ? (
            <>
              <Body dim>{error}</Body>
              <ActionButton label="Go to my trips" icon="luggage" variant="glass" onPress={() => router.replace('/trips')} />
            </>
          ) : (
            <Body dim>Joining</Body>
          )}
        </View>
      </Glass>
    </View>
  );
}
