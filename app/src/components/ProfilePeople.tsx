import { useCallback, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';
import { View } from 'react-native';
import { supabase } from '../supabase';
import { useTrips } from '../store';
import { useSession } from '../auth';
import { useColors } from '../theme';
import type { Person } from '../database.types';
import { ActionButton, Avatar, Body, Heading, TextArea } from './ui';

const reasons = ['Harassment', 'Spam', 'Impersonation', 'Other'] as const;
const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as const;
const groups = [
  { state: 'incoming', label: 'Friend requests' },
  { state: 'friend', label: 'Friends' },
  { state: 'outgoing', label: 'Sent requests' },
  { state: 'blocked', label: 'Blocked accounts' },
] as const;
type RelationshipAction = 'request' | 'accept' | 'remove' | 'block' | 'unblock';

export function ProfilePeople() {
  const c = useColors();
  const { members, refreshMembers } = useTrips();
  const session = useSession();
  const me = session.status === 'signedIn' ? session.user.id : null;
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Person[] | null>(null);
  const [selected, setSelected] = useState<Person | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reason, setReason] = useState<(typeof reasons)[number] | null>(null);
  const [reporting, setReporting] = useState(false);
  const [details, setDetails] = useState('');
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (search?: string) => {
    const { data, error } = await supabase.rpc('profile_people', search ? { search_handle: search } : {});
    if (search) {
      if (error) throw error;
      setFound(data ?? []);
    } else {
      setLoadError(!!error);
      if (!error) setPeople(data ?? []);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    const interval = setInterval(() => void load(), 15000);
    return () => clearInterval(interval);
  }, [load]));

  const choose = (person: Person | null) => {
    setSelected(person);
    setConfirmBlock(false);
    setReporting(false);
    setReason(null);
    setDetails('');
    setNotice('');
  };

  const search = async () => {
    const handle = query.trim().replace(/^@/, '');
    if (!handle || busy) return;
    choose(null);
    setFound(null);
    setBusy(true);
    try {
      await load(handle);
    } catch {
      setNotice('Could not search WayStory accounts. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const change = async (action: RelationshipAction) => {
    if (!selected || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const { error } = await supabase.rpc('change_profile_relationship', { person_id: selected.id, action });
      if (error) throw error;
      choose(null);
      setFound(null);
      setNotice({
        request: 'Friend request sent.', accept: 'Friend request accepted.', remove: 'Connection removed.',
        block: 'Account blocked.', unblock: 'Account unblocked.',
      }[action]);
      await Promise.all([load(), refreshMembers()]);
    } catch {
      setNotice('Could not update this connection. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const report = async () => {
    if (!selected || !reason || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('report_profile', {
        person_id: selected.id, report_reason: reason, report_details: details.trim(),
      });
      if (error) throw error;
      choose(null);
      setNotice('Report submitted.');
    } catch {
      setNotice('Could not submit your report. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const status = selected && (people.find((p) => p.id === selected.id)?.relationship ?? selected.relationship);
  const tripPeople = members.filter((m) =>
    m.user_id !== me && !people.some((p) => p.id === m.user_id) && !found?.some((p) => p.id === m.user_id));

  const personRow = (person: Person, actions?: ReactNode) => (
    <View key={person.id} style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: c.glassEdge }}>
      <Avatar name={person.name} url={person.avatar_url} />
      <View style={{ flex: 1 }}>
        <Body>{person.name || 'Traveler'}</Body>
        {person.handle ? <Body dim>@{person.handle}</Body> : null}
      </View>
      <ActionButton label={selected?.id === person.id ? 'Close' : person.relationship === 'incoming' ? 'Respond' : 'Manage'} variant="glass" disabled={busy} onPress={() => choose(selected?.id === person.id ? null : person)} />
    </View>
    {selected?.id === person.id ? actions : null}
    </View>
  );

  const actions = selected && (
    <View style={{ gap: 10, padding: 16, borderWidth: 1, borderRadius: 16, borderColor: c.glassEdge, backgroundColor: c.field }}>
      <Heading size={22}>{selected.name || 'Traveler'}</Heading>
      {confirmBlock ? <>
        <Body>Blocking removes your connection and hides your trip locations from each other.</Body>
        <View style={row}>
          <ActionButton label="Confirm block" busy={busy} onPress={() => void change('block')} />
          <ActionButton label="Cancel block" variant="glass" disabled={busy} onPress={() => setConfirmBlock(false)} />
        </View>
      </> : reporting ? <>
        <Body>Why are you reporting this account?</Body>
        <View style={row}>
          {reasons.map((item) => <ActionButton key={item} label={item} variant={reason === item ? 'primary' : 'glass'} disabled={busy} onPress={() => setReason(item)} />)}
        </View>
        <TextArea label="Details (optional)" value={details} onChangeText={setDetails} maxLength={500} editable={!busy} />
        <View style={row}>
          <ActionButton label="Send report" disabled={!reason || busy} onPress={() => void report()} />
          <ActionButton label="Cancel report" variant="glass" disabled={busy} onPress={() => setReporting(false)} />
        </View>
      </> : <View style={row}>
        {status === 'none' && <ActionButton label="Add friend" icon="person-add" disabled={busy} onPress={() => void change('request')} />}
        {status === 'incoming' && <ActionButton label="Accept" disabled={busy} onPress={() => void change('accept')} />}
        {status && ['incoming', 'outgoing', 'friend'].includes(status) && <ActionButton label={status === 'incoming' ? 'Decline' : status === 'outgoing' ? 'Cancel request' : 'Remove friend'} variant="glass" disabled={busy} onPress={() => void change('remove')} />}
        {status === 'blocked'
          ? <ActionButton label="Unblock" variant="glass" disabled={busy} onPress={() => void change('unblock')} />
          : <ActionButton label="Block" icon="block" variant="glass" disabled={busy} onPress={() => setConfirmBlock(true)} />}
        <ActionButton label="Report" icon="flag" variant="glass" disabled={busy} onPress={() => setReporting(true)} />
        <ActionButton label="Close actions" variant="glass" disabled={busy} onPress={() => choose(null)} />
      </View>}
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      <Heading size={28}>People</Heading>
      <TextArea label="Find someone by username" value={query} editable={!busy} onChangeText={(value) => { setQuery(value); setFound(null); choose(null); }} multiline={false} maxLength={80} autoCapitalize="none" autoCorrect={false} onSubmitEditing={() => void search()} style={{ color: c.ink, minHeight: 34, fontSize: 17 }} />
      <View style={row}>
        <ActionButton label="Find people" icon="search" disabled={busy || !query.trim().replace(/^@/, '')} onPress={() => void search()} />
        {loadError && <ActionButton label="Retry connections" variant="glass" disabled={busy} onPress={() => void load()} />}
      </View>
      {loadError && <Body dim>Could not load connections.</Body>}
      {found?.length === 0 && <Body dim>No account found for that username.</Body>}
      {found?.map((person) => personRow(person, actions))}
      {notice ? <View accessibilityLiveRegion="polite"><Body>{notice}</Body></View> : null}
      {!loadError && !people.length && <Body dim>Search for a username to send your first friend request.</Body>}
      {groups.map(({ state, label }) => {
        const group = people.filter((p) => p.relationship === state && !found?.some((result) => result.id === p.id));
        return group.length ? <View key={state} style={{ gap: 4 }}><Heading size={22}>{label}</Heading>{group.map((person) => personRow(person, actions))}</View> : null;
      })}
      {tripPeople.length > 0 && <View style={{ gap: 4 }}>
        <Heading size={22}>On your trip</Heading>
        {tripPeople.map((m) => personRow({ id: m.user_id, name: m.name, handle: m.handle, avatar_url: m.avatar_url, relationship: 'none' }, actions))}
      </View>}
    </View>
  );
}
