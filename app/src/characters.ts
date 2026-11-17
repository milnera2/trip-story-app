// A profile picture is either a photo URL or a character. Characters are stored in profiles.avatar_url
// as "character:<id>:<rrggbb>" so nothing else in the app needs a new field.
export const CHARACTERS = [
  { id: 'fox', label: 'Fox' },
  { id: 'bear', label: 'Bear' },
  { id: 'cat', label: 'Cat' },
  { id: 'bunny', label: 'Bunny' },
  { id: 'frog', label: 'Frog' },
  { id: 'owl', label: 'Owl' },
  { id: 'panda', label: 'Panda' },
  { id: 'penguin', label: 'Penguin' },
] as const;

export type CharacterId = (typeof CHARACTERS)[number]['id'];

export const CHARACTER_COLORS = [
  { hex: '#FF6B4A', label: 'Coral' },
  { hex: '#33AEEA', label: 'Sky blue' },
  { hex: '#9CBF6B', label: 'Moss' },
  { hex: '#F2B84B', label: 'Gold' },
  { hex: '#B07CE8', label: 'Violet' },
  { hex: '#2FBF9B', label: 'Teal' },
  { hex: '#E86FA8', label: 'Pink' },
  { hex: '#8A6A4F', label: 'Brown' },
] as const;

export type ParsedAvatar = { kind: 'photo'; url: string } | { kind: 'character'; id: CharacterId; color: string } | { kind: 'none' };

const pattern = /^character:([a-z]{2,12}):([0-9a-f]{6})$/;

export function parseAvatar(value?: string | null): ParsedAvatar {
  if (!value) return { kind: 'none' };
  const match = pattern.exec(value);
  if (!match) return { kind: 'photo', url: value };
  const id = CHARACTERS.find((c) => c.id === match[1])?.id;
  return id ? { kind: 'character', id, color: `#${match[2]}` } : { kind: 'none' };
}

export const characterAvatar = (id: CharacterId, color: string) => `character:${id}:${color.replace('#', '').toLowerCase()}`;
