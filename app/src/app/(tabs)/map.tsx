import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSession } from '../../auth';
import { Glass } from '../../components/Glass';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';
import { TripMap } from '../../components/TripMap';
import { ActionButton, Avatar, Body, Heading } from '../../components/ui';
import { PERSON_COLORS } from '../../geo';
import { categoryIcon } from '../../categories';
import { dayNumber, plural } from '../../format';
import { useTrips } from '../../store';
import { supabase } from '../../supabase';
import { fonts, useColors } from '../../theme';

export default function MapTab() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const meId = session.status === 'signedIn' ? session.user.id : '';
  const { active, stops, selectedStopId, setSelectedStopId, loading, members, tracks, recordPoint, refreshMembers } = useTrips();
  const [ownProfile, setOwnProfile] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  useFocusEffect(useCallback(() => {
    void refreshMembers();
    if (!meId) return;
    let current = true;
    supabase.from('profiles').select('id, name, avatar_url').eq('id', meId).single().then(({ data }) => {
      if (current && data) setOwnProfile(data);
    });
    return () => { current = false; };
  }, [meId, refreshMembers]));
  const [cardHeight, setCardHeight] = useState(210);

  const mapStops = useMemo(() => stops.map(({ id, lat, lng, title, category }) => ({ id, lat, lng, title, category })), [stops]);
  const people = useMemo(() => {
    const travelers = members.filter((member) => member.user_id !== meId).map((member) => {
      const hue = Number.parseInt(member.user_id.slice(0, 8), 16) % (PERSON_COLORS.length - 1);
      return { id: member.user_id, name: member.name, avatar: member.avatar_url, me: false, color: PERSON_COLORS[hue + 1] };
    });
    if (!meId) return travelers;
    const self = ownProfile?.id === meId ? ownProfile : members.find((member) => member.user_id === meId);
    return [{ id: meId, name: self?.name || 'You', avatar: self?.avatar_url ?? null, me: true, color: c.pin }, ...travelers];
  }, [members, ownProfile, meId, c.pin]);
  const shown = stops.find((s) => s.id === selectedStopId) ?? stops[stops.length - 1];
  const bottomInset = cardHeight + TAB_BAR_HEIGHT + insets.bottom + 40;
  const controlsTop = insets.top + 70;
  const topInset = insets.top + 190;

  const addStop = (lat?: number, lng?: number) =>
    router.push({ pathname: '/add-stop', params: { tripId: active?.id, ...(lat !== undefined ? { lat: String(lat), lng: String(lng) } : {}) } });

  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <TripMap
        stops={mapStops}
        selectedId={selectedStopId}
        onSelect={setSelectedStopId}
        onLongPress={active ? addStop : undefined}
        people={people}
        tracks={tracks}
        onRecord={active ? recordPoint : undefined}
        controlsTop={controlsTop}
        topInset={topInset}
        bottomInset={bottomInset}
      />

      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, alignItems: 'flex-start' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={active ? `Switch trip. Showing ${active.title}` : 'Start a trip'}
          onPress={() => router.push(active ? '/switch-trip' : '/new-trip')}
        >
          <Glass radius={26}>
            <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: active ? 18 : 14, paddingRight: active ? 12 : 18, maxWidth: 300 }}>
              {active ? null : <MaterialIcons name="add" size={24} color={c.link} />}
              <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: 22, flexShrink: 1 }}>
                {active ? active.title : 'Start a trip'}
              </Text>
              {active ? <MaterialIcons name="expand-more" size={24} color={c.link} /> : null}
            </View>
          </Glass>
        </Pressable>
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + TAB_BAR_HEIGHT + 22, alignItems: 'center' }}
      >
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).reduceMotion(ReduceMotion.System)}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
          style={{ width: '100%', maxWidth: 440 }}
        >
          <Glass pad={18}>
            {loading ? (
              <Body dim>Loading your trips</Body>
            ) : !active ? (
              <View style={{ gap: 12 }}>
                <Heading size={28}>Start your first trip</Heading>
                <Body dim>Pin stops with photos and notes. Friends can join and add their own.</Body>
                <ActionButton label="Start a trip" icon="add" onPress={() => router.push('/new-trip')} />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: 26 }}>
                      {active.title}
                    </Text>
                    <Body dim>
                      Day {dayNumber(active.start_date)} · {plural(stops.length, 'stop')}
                    </Body>
                  </View>
                  <View accessibilityLabel={`${plural(people.length, 'traveler')} on this trip`} style={{ flexDirection: 'row' }}>
                    {people.slice(0, 4).map((p, i) => (
                      <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                        <Avatar name={p.name} size={34} url={p.avatar} ring={p.color} />
                      </View>
                    ))}
                  </View>
                  <ActionButton label="Invite" icon="person-add" variant="glass" small onPress={() => router.push({ pathname: '/trip/[id]', params: { id: active.id, invite: '1' } })} />
                </View>
                {shown ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name={categoryIcon(shown.category)} size={22} color={c.link} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.label, fontSize: 16 }}>
                        {shown.title}
                      </Text>
                      {shown.note ? (
                        <Text numberOfLines={1} style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 14 }}>
                          {shown.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <Body dim>No stops yet. Add one, or tap Drop pin.</Body>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <ActionButton label="Add stop" icon="add-location-alt" onPress={() => addStop()} style={{ flex: 1.2 }} />
                  <ActionButton
                    label="Timeline"
                    icon="timeline"
                    variant="glass"
                    onPress={() => router.push({ pathname: '/trip/[id]', params: { id: active.id } })}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </Glass>
        </Animated.View>
      </View>
    </View>
  );
}
