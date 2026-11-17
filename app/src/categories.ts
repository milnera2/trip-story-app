import type { IconName } from './components/ui';

export const categories: { key: string; label: string; icon: IconName }[] = [
  { key: 'place', label: 'Place', icon: 'place' },
  { key: 'beach', label: 'Beach', icon: 'beach-access' },
  { key: 'food', label: 'Food', icon: 'restaurant' },
  { key: 'nature', label: 'Nature', icon: 'park' },
  { key: 'water', label: 'Water', icon: 'water' },
  { key: 'stay', label: 'Stay', icon: 'hotel' },
];

export const categoryIcon = (key: string): IconName => categories.find((c) => c.key === key)?.icon ?? 'place';
