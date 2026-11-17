import { useState } from 'react';
import { useLeave } from '../leave';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Field } from '../components/controls';
import { Sheet } from '../components/Sheet';
import { ActionButton } from '../components/ui';
import { supabase } from '../supabase';
import { useTrips } from '../store';
import { fonts, useColors } from '../theme';

export default function NewTrip() {
  const c = useColors();
  const router = useRouter();
  const leave = useLeave();
  const { reload, setActiveId } = useTrips();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return setError('Name your trip.');
    setError('');
    setSaving(true);
    const { data, error: e } = await supabase.from('trips').insert({ title: title.trim(), subtitle: subtitle.trim(), start_date: new Date().toLocaleDateString('en-CA') }).select('id').single();
    if (e || !data) {
      setError(e?.message ?? 'Could not start the trip.');
      return setSaving(false);
    }
    await reload();
    setActiveId(data.id);
    router.replace('/map');
  };

  return (
    <Sheet title="New trip" onClose={() => leave()}>
      <Field label="Trip name" value={title} onChangeText={setTitle} autoCapitalize="words" returnKeyType="next" />
      <Field label="Route or place (optional)" value={subtitle} onChangeText={setSubtitle} autoCapitalize="sentences" returnKeyType="done" onSubmitEditing={save} />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={{ color: c.error, fontFamily: fonts.body, fontSize: 15 }}>
          {error}
        </Text>
      ) : null}
      <ActionButton label="Start trip" icon="flag" busy={saving} onPress={save} />
    </Sheet>
  );
}
