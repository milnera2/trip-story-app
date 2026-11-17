import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { MaterialIcons } from '@expo/vector-icons';
import { useSession } from '../auth';
import { Glass } from './Glass';
import { ActionButton, Body, IconName } from './ui';
import { plural, range } from '../format';
import { supabase } from '../supabase';
import { TripRow, useTrips } from '../store';
import { fonts, useColors } from '../theme';

// One trip in a list: tap to open, then Pin, Share or Delete on the right.
export function TripCard({ trip }: { trip: TripRow }) {
  const c = useColors();
  const router = useRouter();
  const session = useSession();
  const { active, pinned, togglePinned, reload } = useTrips();
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const isPinned = pinned.has(trip.id);
  const isOwner = session.status === 'signedIn' && session.user.id === trip.owner_id;

  const share = async () => {
    await Clipboard.setStringAsync(Linking.createURL(`s/${trip.share_token}`));
    setNote('Story link copied. Anyone with it can read the trip.');
  };

  const remove = async () => {
    const { error } = await supabase.from('trips').delete().eq('id', trip.id);
    if (error) return setNote(error.message);
    setConfirming(false);
    reload();
  };

  const action = (label: string, icon: IconName, on: boolean, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) =>
        ({
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 22,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderWidth: 1,
          borderColor: on ? c.primary : c.glassEdge,
          backgroundColor: on ? c.chipOn : c.chip,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          transitionProperty: 'transform, background-color, border-color',
          transitionDuration: '160ms',
        }) as object
      }
    >
      <MaterialIcons name={icon} size={20} color={on ? c.link : c.onSheetVariant} />
      <Text style={{ color: on ? c.link : c.onSheet, fontFamily: fonts.label, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );

  return (
    <Glass pad={18}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${trip.title}, ${plural(trip.stop_count, 'stop')}`}
        onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}
        style={{ gap: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, color: c.ink, fontFamily: fonts.wordmark, fontSize: 26 }}>
            {trip.title}
          </Text>
          {isPinned ? <MaterialIcons name="push-pin" size={20} color={c.link} /> : null}
        </View>
        {trip.subtitle ? <Body dim>{trip.subtitle}</Body> : null}
        <Body dim>
          {range(trip.start_date, trip.end_date)} · {plural(trip.stop_count, 'stop')}
        </Body>
        <Text style={{ color: trip.status === 'active' ? c.link : c.onSheetVariant, fontFamily: fonts.label, fontSize: 14, marginTop: 4 }}>
          {trip.id === active?.id ? 'Showing on the map' : trip.status === 'active' ? 'Active' : 'Completed'}
        </Text>
      </Pressable>

      {confirming ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <Body>Delete this trip and all its stops? This cannot be undone.</Body>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <ActionButton label="Keep trip" icon="close" variant="glass" small onPress={() => setConfirming(false)} />
            <ActionButton label="Delete" icon="delete" small onPress={remove} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          {action(isPinned ? 'Unpin' : 'Pin', 'push-pin', isPinned, () => togglePinned(trip.id))}
          {action('Share', 'share', false, share)}
          {isOwner ? action('Delete', 'delete', false, () => setConfirming(true)) : null}
        </View>
      )}
      {note ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 8 }}>
          <Text accessibilityLiveRegion="polite" style={{ flexShrink: 1, color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 14, textAlign: 'right' }}>
            {note}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close message" onPress={() => setNote('')} hitSlop={8} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="close" size={18} color={c.onSheetVariant} />
          </Pressable>
        </View>
      ) : null}
    </Glass>
  );
}
