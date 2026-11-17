const DAY = 86_400_000;

export const dayNumber = (start: string, now = new Date()) =>
  Math.max(1, Math.floor((now.getTime() - new Date(start + 'T00:00:00').getTime()) / DAY) + 1);

export const dayOf = (start: string, iso: string) =>
  Math.max(1, Math.floor((new Date(iso).getTime() - new Date(start + 'T00:00:00').getTime()) / DAY) + 1);

export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const dateOf = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

export const range = (start: string, end: string | null) => {
  const a = new Date(start + 'T00:00:00');
  const fmt = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return end ? `${fmt(a)} to ${fmt(new Date(end + 'T00:00:00'))}` : `Started ${fmt(a)}`;
};

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
