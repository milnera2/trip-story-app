import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '../../components/Glass';
import { TripCard } from '../../components/TripCard';
import { Still } from '../../components/Still';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';
import { ActionButton, Body, Heading } from '../../components/ui';
import { useTrips } from '../../store';
import { useColors } from '../../theme';

export default function TripsTab() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trips, pinned, loading } = useTrips();
  // Pinned trips float to the top, keeping newest-first inside each group.
  const list = [...trips].sort((a, b) => Number(pinned.has(b.id)) - Number(pinned.has(a.id)));

  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Still index={0} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40,
          paddingHorizontal: 16,
          gap: 16,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        <Heading>Your trips</Heading>
        <ActionButton label="New trip" icon="add" onPress={() => router.push('/new-trip')} style={{ alignSelf: 'flex-start' }} />

        {!loading && trips.length === 0 ? (
          <Glass pad={18}>
            <Body dim>No trips yet. Start one and it shows up here.</Body>
          </Glass>
        ) : null}

        {list.map((t) => (
          <TripCard key={t.id} trip={t} />
        ))}
      </ScrollView>
    </View>
  );
}
