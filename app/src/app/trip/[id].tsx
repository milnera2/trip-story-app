import { useCallback, useMemo, useState } from 'react';
import { useLeave } from '../../leave';
import { Image, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { tripLink } from '../../tripLinks';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../auth';
import { Field, Snackbar } from '../../components/controls';
import { Glass } from '../../components/Glass';
import { Still } from '../../components/Still';
import { ActionButton, Avatar, Body, Heading } from '../../components/ui';
import { categoryIcon } from '../../categories';
import { dateOf, dayOf, plural, range, timeOf } from '../../format';
import { signedUrls } from '../../media';
import { Video } from '../../components/Video';
import { supabase } from '../../supabase';
import { useTrips } from '../../store';
import type { Photo, Stop, Trip } from '../../database.types';
import { fonts, useColors } from '../../theme';

type Member = { user_id: string; role: string; profiles: { name: string; handle: string; avatar_url: string | null } | null };

export default function TripDetail() {
  const c = useColors();
  const router = useRouter();
  const leave = useLeave();
  const insets = useSafeAreaInsets();
  const { id, invite: openInvite } = useLocalSearchParams<{ id: string; invite?: string }>();
  const session = useSession();
  const me = session.status === 'signedIn' ? session.user.id : '';
  const { setActiveId, reload } = useTrips();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState(false);
  const [invite, setInvite] = useState(openInvite === '1');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const tell = (m: string) => {
    setSnack(m);
    setTimeout(() => setSnack(null), 4000);
  };

  const load = useCallback(async () => {
    const [t, s, p, m] = await Promise.all([
      supabase.from('trips').select('*').eq('id', id).maybeSingle(),
      supabase.from('stops').select('*').eq('trip_id', id).order('taken_at'),
      supabase.from('photos').select('*').eq('trip_id', id),
      supabase.from('trip_members').select('user_id, role, profiles(name, handle, avatar_url)').eq('trip_id', id),
    ]);
    if (!t.data) return setMissing(true);
    setTrip(t.data);
    setStops(s.data ?? []);
    setPhotos(p.data ?? []);
    setMembers((m.data ?? []) as unknown as Member[]);
    setUrls(await signedUrls((p.data ?? []).map((x) => x.path)));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const owner = members.find((m) => m.user_id === me)?.role === 'owner';
  const nameOf = (uid: string) => members.find((m) => m.user_id === uid)?.profiles?.name || 'Traveler';

  const days = useMemo(() => {
    if (!trip) return [];
    const byDay = new Map<number, Stop[]>();
    stops.forEach((s) => {
      const d = dayOf(trip.start_date, s.taken_at);
      byDay.set(d, [...(byDay.get(d) ?? []), s]);
    });
    return [...byDay.entries()].sort((a, b) => a[0] - b[0]);
  }, [trip, stops]);

  const copy = async (text: string, done: string) => {
    await Clipboard.setStringAsync(text);
    tell(done);
  };

  const addMember = async () => {
    if (!trip || !handle.trim()) return tell('Type the username first.');
    setBusy(true);
    const { error } = await supabase.rpc('add_member_by_handle', { trip: trip.id, member_handle: handle.trim() });
    setBusy(false);
    if (error) return tell(error.message);
    setHandle('');
    tell('Added to the trip.');
    load();
  };

  if (missing) {
    return (
      <View style={{ flex: 1, backgroundColor: c.page, padding: 24, paddingTop: insets.top + 24, gap: 16 }}>
        <Heading>Trip not found</Heading>
        <Body dim>You may not be on this trip. Ask the owner for an invite link.</Body>
        <ActionButton label="Back" icon="arrow-back" variant="glass" onPress={() => leave()} style={{ alignSelf: 'flex-start' }} />
      </View>
    );
  }
  if (!trip) return <View style={{ flex: 1, backgroundColor: c.page }} />;

  const inviteLink = tripLink('join', trip.invite_token);
  const storyLink = tripLink('s', trip.share_token);

  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Still />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 60, paddingHorizontal: 16, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' }}
      >
        <ActionButton label="Back" icon="arrow-back" variant="glass" small onPress={() => leave()} style={{ alignSelf: 'flex-start' }} />

        <View style={{ gap: 4 }}>
          <Heading size={38}>{trip.title}</Heading>
          {trip.subtitle ? <Body>{trip.subtitle}</Body> : null}
          <Body dim>
            {range(trip.start_date, trip.end_date)} · {plural(stops.length, 'stop')}
          </Body>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {members.map((m) => (
            <Avatar key={m.user_id} name={m.profiles?.name || 'Traveler'} size={36} url={m.profiles?.avatar_url} />
          ))}
          <Body dim style={{ flexShrink: 1 }}>
            {members.map((m) => m.profiles?.name || 'Traveler').join(', ')}
          </Body>
        </View>

        <ActionButton label="Add stop" icon="add-location-alt" onPress={() => router.push({ pathname: '/add-stop', params: { tripId: trip.id } })} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <ActionButton
            label="Show on map"
            icon="map"
            variant="glass"
            small
            onPress={() => {
              setActiveId(trip.id);
              router.navigate('/map');
            }}
          />
          <ActionButton label="Invite" icon="person-add" variant="glass" small onPress={() => setInvite((v) => !v)} />
          <ActionButton label="Share story" icon="share" variant="glass" small onPress={() => copy(storyLink, 'Story link copied. Anyone with it can read the trip.')} />
        </View>

        {invite ? (
          <Glass pad={18}>
            <View style={{ gap: 12 }}>
              <Text style={{ color: c.ink, fontFamily: fonts.title, fontSize: 22 }}>Invite travelers</Text>
              <Body dim>Anyone with this link can join after they sign in.</Body>
              <Text selectable numberOfLines={1} style={{ color: c.link, fontFamily: fonts.body, fontSize: 14 }}>
                {inviteLink}
              </Text>
              <ActionButton label="Copy invite link" icon="content-copy" variant="glass" small onPress={() => copy(inviteLink, 'Invite link copied.')} style={{ alignSelf: 'flex-start' }} />
              {owner ? (
                <>
                  <Field label="Username" value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} onSubmitEditing={addMember} />
                  <ActionButton label="Invite by username" icon="person-add" busy={busy} small onPress={addMember} style={{ alignSelf: 'flex-start' }} />
                </>
              ) : null}
            </View>
          </Glass>
        ) : null}

        {days.length === 0 ? (
          <Glass pad={18}>
            <Body dim>No stops yet. Add the first one and it appears here and on the map.</Body>
          </Glass>
        ) : null}

        {days.map(([day, list]) => (
          <View key={day} style={{ gap: 8 }}>
            <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: 24, marginTop: 6 }}>
              Day {day} <Text style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 16 }}>{dateOf(list[0].taken_at)}</Text>
            </Text>
            <Glass pad={18}>
              <View style={{ gap: 18 }}>
                {list.map((s) => (
                  <View key={s.id} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: c.chipOn, borderWidth: 1, borderColor: c.primary }}>
                      <MaterialIcons name={categoryIcon(s.category)} size={20} color={c.link} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: c.ink, fontFamily: fonts.title, fontSize: 20 }}>{s.title}</Text>
                      <Text style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 14 }}>
                        {timeOf(s.taken_at)}
                        {members.length > 1 ? ` · ${nameOf(s.author_id)}` : ''}
                      </Text>
                      {s.note ? <Body>{s.note}</Body> : null}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {photos
                          .filter((p) => p.stop_id === s.id && urls[p.path])
                          .map((p) => (
                            p.kind === 'video' ? (
                              <Video key={p.id} uri={urls[p.path]} label={`Video from ${s.title}`} />
                            ) : (
                              <Image key={p.id} source={{ uri: urls[p.path] }} accessibilityLabel={`Photo from ${s.title}`} style={{ width: 96, height: 96, borderRadius: 12 }} />
                            )
                          ))}
                      </ScrollView>
                    </View>
                  </View>
                ))}
              </View>
            </Glass>
          </View>
        ))}
      </ScrollView>
      <Snackbar message={snack} onClose={() => setSnack(null)} />
    </View>
  );
}
