import { useEffect, useState } from 'react';
import { useLeave } from '../leave';
import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { Field } from '../components/controls';
import { Sheet } from '../components/Sheet';
import { ActionButton, Body, Chip, TextArea } from '../components/ui';
import { categories } from '../categories';
import { MAX_FILE_BYTES, MAX_VIDEO_SECONDS, Picked, uploadMedia } from '../media';
import { supabase } from '../supabase';
import { useTrips } from '../store';
import { fonts, useColors } from '../theme';

type Coords = { lat: number; lng: number };

export default function AddStop() {
  const c = useColors();
  const router = useRouter();
  const leave = useLeave();
  const params = useLocalSearchParams<{ tripId?: string; lat?: string; lng?: string }>();
  const { active, reload, setSelectedStopId } = useTrips();
  const tripId = params.tripId ?? active?.id;

  const fromMap = params.lat && params.lng ? { lat: Number(params.lat), lng: Number(params.lng) } : null;
  const [coords, setCoords] = useState<Coords | null>(fromMap);
  const [where, setWhere] = useState<'idle' | 'busy' | 'denied'>(fromMap ? 'idle' : 'busy');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('place');
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const locate = async () => {
    setWhere('busy');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return setWhere('denied');
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      setWhere('idle');
    } catch {
      setWhere('denied');
    }
  };

  useEffect(() => {
    if (!fromMap) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMedia = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 4 - photos.length,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });
    if (r.canceled) return;
    setError('');
    const ok: Picked[] = [];
    for (const x of r.assets) {
      const video = x.type === 'video';
      if (video && x.duration != null && x.duration > (MAX_VIDEO_SECONDS + 0.5) * 1000) {
        setError(`Videos can be up to ${MAX_VIDEO_SECONDS} seconds. Trim it and try again.`);
      } else if (x.fileSize != null && x.fileSize > MAX_FILE_BYTES) {
        setError('That file is over 50 MB.');
      } else {
        ok.push({ uri: x.uri, kind: video ? 'video' : 'photo', mime: x.mimeType });
      }
    }
    setPhotos((p) => [...p, ...ok].slice(0, 4));
  };

  const save = async () => {
    if (!tripId) return setError('Start a trip first.');
    if (!title.trim()) return setError('Name this stop.');
    if (!coords) return setError('Choose where this stop is: use your location, or tap Drop pin on the map.');
    setError('');
    setSaving(true);
    try {
      const { data, error: e } = await supabase
        .from('stops')
        .insert({ trip_id: tripId, title: title.trim(), note: note.trim(), category, lat: coords.lat, lng: coords.lng })
        .select('id')
        .single();
      if (e || !data) throw e ?? new Error('Could not save the stop.');
      for (const item of photos) {
        const path = await uploadMedia(tripId, data.id, item);
        await supabase.from('photos').insert({ stop_id: data.id, trip_id: tripId, path, kind: item.kind });
      }
      await reload();
      setSelectedStopId(data.id);
      leave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the stop.');
      setSaving(false);
    }
  };

  const whereText = coords
    ? `Pinned at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
    : where === 'busy'
      ? 'Finding your location'
      : 'No location yet. Allow location, or tap Drop pin on the map to place a stop.';

  return (
    <Sheet title="Add stop" onClose={() => leave()}>
      <Field label="Place name" value={title} onChangeText={setTitle} autoCapitalize="words" returnKeyType="next" />
      <TextArea label="Note" value={note} onChangeText={setNote} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categories.map((k) => (
          <Chip key={k.key} label={k.label} icon={k.icon} on={category === k.key} onPress={() => setCategory(k.key)} />
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Body dim style={{ fontSize: 14, lineHeight: 19 }}>Up to 4 photos or videos. Videos can be 30 seconds.</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {photos.map(({ uri, kind }) => (
            <View key={uri}>
              <Image source={{ uri }} accessibilityLabel={kind === 'video' ? 'Selected video' : 'Selected photo'} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#000' }} />
              {kind === 'video' ? (
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="play-circle-filled" size={28} color="#fff" />
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={kind === 'video' ? 'Remove video' : 'Remove photo'}
                onPress={() => setPhotos((p) => p.filter((x) => x.uri !== uri))}
                hitSlop={8}
                style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: c.inverseSurface, alignItems: 'center', justifyContent: 'center' }}
              >
                <MaterialIcons name="close" size={16} color={c.inverseOnSurface} />
              </Pressable>
            </View>
          ))}
          {photos.length < 4 ? <ActionButton label="Add photo or video" icon="add-a-photo" variant="glass" small onPress={addMedia} /> : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <MaterialIcons name="my-location" size={20} color={coords ? c.link : c.onSheetVariant} />
        <Text style={{ flex: 1, color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 15 }}>{whereText}</Text>
        {where !== 'busy' ? <ActionButton label={coords ? 'Update' : 'Use my location'} icon={coords ? 'refresh' : 'gps-fixed'} variant="glass" small onPress={locate} /> : null}
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={{ color: c.error, fontFamily: fonts.body, fontSize: 15 }}>
          {error}
        </Text>
      ) : null}
      {!tripId ? <Body dim>You need a trip before you can add stops.</Body> : null}
      <ActionButton label="Save stop" icon="check" busy={saving} onPress={save} />
    </Sheet>
  );
}
