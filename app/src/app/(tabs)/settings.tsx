import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut, useSession } from '../../auth';
import { Field } from '../../components/controls';
import { Glass } from '../../components/Glass';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';
import { ActionButton, Body, Chip, Heading, IconName } from '../../components/ui';
import { Appearance, updateSettings, useSettings } from '../../settings';
import { supabase } from '../../supabase';
import { fonts, useColors } from '../../theme';

const MAP_OPTIONS: { key: 'buildings3d' | 'terrain3d' | 'trail'; label: string; hint: string; icon: IconName }[] = [
  { key: 'buildings3d', label: '3D buildings', hint: 'Raise buildings off the map', icon: 'apartment' },
  { key: 'terrain3d', label: '3D terrain', hint: 'Show hills and mountains in relief', icon: 'terrain' },
  { key: 'trail', label: 'Show my trail', hint: 'Draw where you have walked', icon: 'timeline' },
];

export default function SettingsTab() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const user = session.status === 'signedIn' ? session.user : null;
  const settings = useSettings();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('name').eq('id', user.id).single().then(({ data }) => setName(data?.name || user.email?.split('@')[0] || ''));
  }, [user]);

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id);
    setBusy(false);
    setSaved(error ? error.message : 'Name saved.');
  };

  const section = (text: string) => (
    <Text accessibilityRole="header" style={{ color: c.onSheetVariant, fontFamily: fonts.label, fontSize: 14, letterSpacing: 0.6, textTransform: 'uppercase' }}>
      {text}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.plain }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40, paddingHorizontal: 16, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' }}
      >
        <Heading>Settings</Heading>

        {section('Appearance')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(
            [
              ['light', 'Light', 'light-mode'],
              ['dark', 'Dark', 'dark-mode'],
            ] as [Appearance, string, IconName][]
          ).map(([key, label, icon]) => (
            <Chip key={key} label={label} icon={icon} on={settings.appearance === key} onPress={() => updateSettings({ appearance: key })} />
          ))}
        </View>

        {section('Map')}
        <Glass pad={6}>
          {MAP_OPTIONS.map((o) => (
            <View key={o.key} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12 }}>
              <MaterialIcons name={o.icon} size={24} color={c.link} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.ink, fontFamily: fonts.label, fontSize: 17 }}>{o.label}</Text>
                <Body dim style={{ fontSize: 14, lineHeight: 19 }}>{o.hint}</Body>
              </View>
              <Switch
                accessibilityLabel={o.label}
                value={settings[o.key]}
                onValueChange={(v) => updateSettings({ [o.key]: v })}
                trackColor={{ false: c.track, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </Glass>

        {section('Account')}
        <Glass pad={18}>
          <View style={{ gap: 12 }}>
            <Body dim>{user?.email}</Body>
            <Field label="Display name" value={name} onChangeText={(t) => { setName(t); setSaved(null); }} />
            <ActionButton label="Save name" icon="check" small busy={busy} disabled={!name.trim()} onPress={saveName} style={{ alignSelf: 'flex-start' }} />
            {saved ? <Body dim style={{ fontSize: 14 }}>{saved}</Body> : null}
          </View>
        </Glass>

        <ActionButton label="Sign out" icon="logout" variant="glass" onPress={() => signOut()} style={{ alignSelf: 'flex-start' }} />
      </ScrollView>
    </View>
  );
}
