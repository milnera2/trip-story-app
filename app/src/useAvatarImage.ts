import { useEffect, useState } from 'react';
import { characterImage } from './characterImage';
import { parseAvatar } from './characters';

// What to draw for a stored avatar value: a photo URL, a rendered character, or nothing (show initials).
export function useAvatarImage(value?: string | null): { uri: string | null; character: string | null } {
  const [rendered, setRendered] = useState<string | null>(null);
  const parsed = parseAvatar(value);
  useEffect(() => {
    const p = parseAvatar(value);
    setRendered(null);
    if (p.kind !== 'character') return;
    let current = true;
    characterImage(p.id, p.color).then((uri) => current && setRendered(uri));
    return () => {
      current = false;
    };
  }, [value]);
  if (parsed.kind === 'photo') return { uri: parsed.url, character: null };
  if (parsed.kind === 'character') return { uri: rendered, character: parsed.color };
  return { uri: null, character: null };
}
