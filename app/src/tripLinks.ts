const publicApp = 'https://milnera2.github.io/trip-story-app/waystory/';

export function tripLink(kind: 's' | 'join', token: string): string {
  return new URL(`${kind}/${encodeURIComponent(token)}`, publicApp).href;
}
