import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from './auth';
import { supabase } from './supabase';
import type { Stop, Trip } from './database.types';

export type Member = { user_id: string; role: string; name: string; handle: string; avatar_url: string | null };
export type TrackPoint = { lat: number; lng: number; t: string };

export type TripRow = Trip & { stop_count: number };

type Ctx = {
  trips: TripRow[];
  active: TripRow | null;
  setActiveId: (id: string) => void;
  stops: Stop[];
  selectedStopId: string | null;
  setSelectedStopId: (id: string | null) => void;
  loading: boolean;
  reload: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  pinned: Set<string>;
  members: Member[];
  tracks: Record<string, TrackPoint[]>;
  recordPoint: (lat: number, lng: number) => void;
  togglePinned: (tripId: string) => Promise<void>;
};

const TripsContext = createContext<Ctx | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : null;
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tracks, setTracks] = useState<Record<string, TrackPoint[]>>({});
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  const active = useMemo(
    () => trips.find((t) => t.id === activeId) ?? trips.find((t) => t.status === 'active') ?? trips[0] ?? null,
    [trips, activeId],
  );
  const activeTripId = active?.id ?? null;
  const currentTripId = useRef(activeTripId);
  currentTripId.current = activeTripId;

  const loadTrips = useCallback(async () => {
    const { data } = await supabase.from('trips').select('*, stops(count)').order('created_at', { ascending: false });
    const rows = (data ?? []) as unknown as (Trip & { stops: { count: number }[] })[];
    setTrips(rows.map(({ stops: s, ...t }) => ({ ...t, stop_count: s?.[0]?.count ?? 0 })));
    setLoading(false);
  }, []);

  const loadPinned = useCallback(async () => {
    const { data } = await supabase.from('saved_trips').select('trip_id');
    setPinned(new Set((data ?? []).map((r) => r.trip_id)));
  }, []);

  const togglePinned = useCallback(
    async (tripId: string) => {
      const on = pinned.has(tripId);
      // Flip right away so the bookmark feels instant, then confirm with the database.
      setPinned((prev) => {
        const next = new Set(prev);
        if (on) next.delete(tripId);
        else next.add(tripId);
        return next;
      });
      const { error } = on ? await supabase.from('saved_trips').delete().eq('trip_id', tripId) : await supabase.from('saved_trips').insert({ trip_id: tripId });
      if (error) loadPinned();
    },
    [pinned, loadPinned],
  );

  const loadMembers = useCallback(async () => {
    if (!activeTripId) return setMembers([]);
    const { data } = await supabase.from('trip_members').select('user_id, role, profiles(name, handle, avatar_url)').eq('trip_id', activeTripId);
    const rows = (data ?? []) as unknown as { user_id: string; role: string; profiles: { name: string; handle: string; avatar_url: string | null } | null }[];
    if (data && currentTripId.current === activeTripId) {
      const updated = rows.map((r) => ({ user_id: r.user_id, role: r.role, name: r.profiles?.name || 'Traveler', handle: r.profiles?.handle ?? '', avatar_url: r.profiles?.avatar_url ?? null }));
      setMembers((previous) => JSON.stringify(previous) === JSON.stringify(updated) ? previous : updated);
    }
  }, [activeTripId]);

  // Load the latest 1,000 points for the active trip.
  const loadTracks = useCallback(async () => {
    if (!activeTripId) return setTracks({});
    const { data } = await supabase.from('track_points').select('user_id, lat, lng, recorded_at').eq('trip_id', activeTripId).order('recorded_at', { ascending: false }).limit(1000);
    if (!data || currentTripId.current !== activeTripId) return;
    const by: Record<string, TrackPoint[]> = {};
    [...(data ?? [])].reverse().forEach((r) => (by[r.user_id] ??= []).push({ lat: r.lat, lng: r.lng, t: r.recorded_at }));
    setTracks(by);
  }, [activeTripId]);

  const recordPoint = useCallback(
    (lat: number, lng: number) => {
      if (activeTripId) supabase.from('track_points').insert({ trip_id: activeTripId, lat, lng }).then(() => {});
    },
    [activeTripId],
  );

  const loadStops = useCallback(async () => {
    if (!activeTripId) return setStops([]);
    const { data } = await supabase.from('stops').select('*').eq('trip_id', activeTripId).order('taken_at');
    if (currentTripId.current === activeTripId) setStops(data ?? []);
  }, [activeTripId]);

  const reload = useCallback(async () => {
    await Promise.all([loadTrips(), loadStops()]);
  }, [loadTrips, loadStops]);

  useEffect(() => {
    if (!userId) {
      setTrips([]);
      setStops([]);
      setPinned(new Set());
      setLoading(session.status === 'loading');
      return;
    }
    loadTrips();
    loadPinned();
  }, [userId, session.status, loadTrips, loadPinned]);

  useEffect(() => {
    setSelectedStopId(null);
    setMembers([]);
    setTracks({});
    loadStops();
    loadMembers();
    loadTracks();
  }, [loadStops, loadMembers, loadTracks]);

  // Friends add stops while you watch the map, so listen for changes on the open trip.
  useEffect(() => {
    if (!activeTripId) return;
    const channel = supabase
      .channel(`trip-${activeTripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stops', filter: `trip_id=eq.${activeTripId}` }, () => {
        loadStops();
        loadTrips();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'track_points', filter: `trip_id=eq.${activeTripId}` }, (payload) => {
        if (currentTripId.current !== activeTripId) return;
        const r = payload.new as { user_id: string; lat: number; lng: number; recorded_at: string };
        setTracks((prev) => ({ ...prev, [r.user_id]: [...(prev[r.user_id] ?? []), { lat: r.lat, lng: r.lng, t: r.recorded_at }] }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${activeTripId}` }, () => loadMembers())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTripId, loadStops, loadTrips, loadMembers]);

  const refreshMembers = useCallback(async () => {
    await Promise.all([loadMembers(), loadStops()]);
  }, [loadMembers, loadStops]);

  useEffect(() => {
    if (!activeTripId) return;
    const interval = setInterval(() => void refreshMembers(), 15000);
    return () => clearInterval(interval);
  }, [activeTripId, refreshMembers]);

  const value = useMemo<Ctx>(
    () => ({ trips, active, setActiveId, stops, selectedStopId, setSelectedStopId, loading, reload, refreshMembers, pinned, togglePinned, members, tracks, recordPoint }),
    [trips, active, stops, selectedStopId, loading, reload, refreshMembers, pinned, togglePinned, members, tracks, recordPoint],
  );
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): Ctx {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips needs TripsProvider');
  return ctx;
}
