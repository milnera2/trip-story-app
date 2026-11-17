import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../auth';
import { Glass } from '../../components/Glass';
import { ProfilePeople } from '../../components/ProfilePeople';
import { TAB_BAR_HEIGHT } from '../../components/TabBar';
import { ActionButton, Avatar, Body, Heading, TextArea } from '../../components/ui';
import { uploadAvatar } from '../../avatars';
import { supabase } from '../../supabase';
import { useTrips } from '../../store';
import { useColors } from '../../theme';

const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } as const;
const username = /^[a-z0-9_]{3,24}$/;

export default function ProfileTab() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const { refreshMembers } = useTrips();
  const userId = session.status === 'signedIn' ? session.user.id : null;
  const [profile, setProfile] = useState<{ name: string; handle: string; avatar_url: string | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    let current = true;
    supabase.from('profiles').select('name, handle, avatar_url').eq('id', userId).single().then(({ data, error }) => {
      if (!current) return;
      if (error) setNotice('Could not load your profile. Reopen this tab to try again.');
      else setProfile(data);
    });
    return () => { current = false; };
  }, [userId]));

  const saveIdentity = async () => {
    if (!userId || !profile || busy) return;
    const updatedHandle = handle.trim().replace(/^@/, '').toLowerCase();
    if (!name.trim()) return setNotice('Enter a display name.');
    if (handle !== profile.handle && !username.test(updatedHandle)) {
      return setNotice('Use 3–24 letters, numbers, or underscores for your username.');
    }
    if (name.trim() === profile.name && (handle === profile.handle || updatedHandle === profile.handle)) {
      setEditing(false);
      setNotice('');
      return;
    }
    setBusy('identity');
    setNotice('');
    try {
      const { data, error } = await supabase.from('profiles')
        .update({ name: name.trim(), ...(handle !== profile.handle ? { handle: updatedHandle } : {}) })
        .eq('id', userId).select('name, handle, avatar_url').single();
      if (error) throw error;
      setProfile(data);
      setEditing(false);
      setNotice('Profile saved.');
      void refreshMembers();
    } catch (error) {
      const taken = typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
      setNotice(taken ? 'That username is taken.' : 'Could not save your profile. Try again.');
    } finally {
      setBusy('');
    }
  };

  const changePhoto = async (remove: boolean) => {
    if (!userId || !profile || busy) return;
    setBusy('photo');
    setNotice('');
    try {
      let url: string | null = null;
      if (remove) {
        const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
        if (error) throw error;
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        url = await uploadAvatar(userId, asset.uri, asset.mimeType);
      }
      setProfile({ ...profile, avatar_url: url });
      setNotice(remove ? 'Your initials are now shown on the map.' : 'Profile photo updated.');
      void refreshMembers();
    } catch {
      setNotice('Could not update your photo. Try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.plain }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40, paddingHorizontal: 16, gap: 24, width: '100%', maxWidth: 560, alignSelf: 'center' }}
      >
        <Heading>Profile</Heading>
        {profile ? (
          <Glass pad={20}>
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Avatar name={profile.name || 'Traveler'} size={72} url={profile.avatar_url} />
                <View style={{ flex: 1 }}>
                  <Heading size={28}>{profile.name || 'Traveler'}</Heading>
                  <Body dim>@{profile.handle}</Body>
                </View>
              </View>
              <View style={row}>
                <ActionButton label={profile.avatar_url ? 'Change photo' : 'Add a photo'} icon="photo-camera" variant="glass" busy={busy === 'photo'} disabled={!!busy} onPress={() => void changePhoto(false)} />
                {profile.avatar_url ? <ActionButton label="Use initials" variant="glass" disabled={!!busy} onPress={() => void changePhoto(true)} /> : null}
                {!editing && <ActionButton label="Edit profile" icon="edit" variant="glass" disabled={!!busy} onPress={() => {
                  setName(profile.name);
                  setHandle(profile.handle);
                  setNotice('');
                  setEditing(true);
                }} />}
              </View>
              {editing && <>
                <TextArea label="Display name" value={name} onChangeText={setName} multiline={false} maxLength={50} autoCapitalize="words" style={{ color: c.ink, minHeight: 34, fontSize: 17 }} />
                <TextArea label="Username" value={handle} onChangeText={setHandle} multiline={false} maxLength={25} autoCapitalize="none" autoCorrect={false} style={{ color: c.ink, minHeight: 34, fontSize: 17 }} />
                <View style={row}>
                  <ActionButton label="Save profile" busy={busy === 'identity'} disabled={!!busy} onPress={() => void saveIdentity()} />
                  <ActionButton label="Cancel" variant="glass" disabled={!!busy} onPress={() => { setEditing(false); setNotice(''); }} />
                </View>
              </>}
            </View>
          </Glass>
        ) : !notice && <Body dim>Loading your profile…</Body>}
        {notice ? <View accessibilityLiveRegion="polite"><Body>{notice}</Body></View> : null}
        {userId ? <ProfilePeople key={userId} /> : null}
      </ScrollView>
    </View>
  );
}
