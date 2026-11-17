import type { CharacterId } from './characters';

// Native builds have no 3D renderer yet, so they fall back to the initial letter.
export function characterImage(_id: CharacterId, _color: string): Promise<string | null> {
  return Promise.resolve(null);
}
