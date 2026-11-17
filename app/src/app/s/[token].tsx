import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '../../components/Glass';
import { Still } from '../../components/Still';
import { TripMap } from '../../components/TripMap';
import { Body, Heading } from '../../components/ui';
import { categoryIcon } from '../../categories';
import { dateOf, dayOf, plural, range, timeOf } from '../../format';
import { supabase } from '../../supabase';
import { fonts, useColors } from '../../theme';

type Shared = {
  title: string;
  subtitle: string;
  start_date: string;
  end_date: string | null;
  travelers: string[];
  stops: { title: string; note: string; category: string; lat: number; lng: number; taken_at: string }[];
};

// Public story page. Opens from a share link with no account.
export default function Story() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [story, setStory] = useState<Shared | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    supabase.rpc('get_shared_trip', { token }).then(({ data }) => (data ? setStory(data as unknown as Shared) : setFailed(true)));
  }, [token]);

  const mapStops = useMemo(() => (story?.stops ?? []).map((s, i) => ({ id: String(i), lat: s.lat, lng: s.lng, title: s.title, category: s.category })), [story]);
  const days = useMemo(() => {
    const byDay = new Map<number, Shared['stops']>();
    story?.stops.forEach((s) => {
      const d = dayOf(story.start_date, s.taken_at);
      byDay.set(d, [...(byDay.get(d) ?? []), s]);
    });
    return [...byDay.entries()].sort((a, b) => a[0] - b[0]);
  }, [story]);

  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Still index={1} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40, paddingHorizontal: 16, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <Text style={{ color: c.link, fontFamily: fonts.wordmark, fontSize: 24 }}>WayStory</Text>
        {failed ? <Body dim>This story link is not valid.</Body> : null}
        {story ? (
          <>
            <View style={{ gap: 4 }}>
              <Heading size={40}>{story.title}</Heading>
              {story.subtitle ? <Body>{story.subtitle}</Body> : null}
              <Body dim>
                {range(story.start_date, story.end_date)} · {plural(story.stops.length, 'stop')}
                {story.travelers.length ? ` · ${story.travelers.join(', ')}` : ''}
              </Body>
            </View>
            {Platform.OS === 'web' ? (
              <View style={{ height: 360, borderRadius: 24, overflow: 'hidden' }}>
                <TripMap stops={mapStops} topInset={30} bottomInset={30} />
              </View>
            ) : null}
            {days.map(([day, list]) => (
              <View key={day} style={{ gap: 8 }}>
                <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: 24 }}>
                  Day {day} <Text style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 16 }}>{dateOf(list[0].taken_at)}</Text>
                </Text>
                <Glass pad={18}>
                  <View style={{ gap: 18 }}>
                    {list.map((s, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                        <MaterialIcons name={categoryIcon(s.category)} size={24} color={c.link} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ color: c.ink, fontFamily: fonts.title, fontSize: 20 }}>{s.title}</Text>
                          <Text style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 14 }}>{timeOf(s.taken_at)}</Text>
                          {s.note ? <Body>{s.note}</Body> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                </Glass>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
