import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Appearance = 'light' | 'dark';
export type Settings = { buildings3d: boolean; terrain3d: boolean; trail: boolean; appearance: Appearance };

const KEY = 'waytrip.settings';
let current: Settings = { buildings3d: true, terrain3d: true, trail: true, appearance: 'light' };
const listeners = new Set<() => void>();

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      const saved = JSON.parse(raw);
      // Older installs stored 'system', which now means light.
      set({ ...saved, appearance: saved.appearance === 'dark' ? 'dark' : 'light' });
    }
  })
  .catch(() => {});

function set(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
  listeners.forEach((l) => l());
}

export const updateSettings = set;

export function useSettings(): Settings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
