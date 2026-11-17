import { createContext, useContext } from 'react';
import { useSettings } from './settings';

type Mode = 'dark' | 'light';

// Dark: moss and deep forest green. Light: cream, vibrant sky blue and coral.
const dark = {
  mode: 'dark' as Mode,
  page: '#0F1B14',
  plain: '#0F1B14',
  glass: 'rgba(15,28,20,0.74)',
  glassEdge: 'rgba(255,255,255,0.14)',
  glassTop: 'rgba(255,255,255,0.34)',
  glassSolid: 'rgba(13,24,17,0.9)',
  glassButton: 'rgba(255,255,255,0.12)',
  chip: 'rgba(255,255,255,0.10)',
  chipOn: 'rgba(156,191,107,0.24)',
  chipEdge: 'rgba(156,191,107,0.55)',
  track: 'rgba(255,255,255,0.18)',
  lift: '0 18px 40px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)',
  liftSmall: '0 8px 20px rgba(0,0,0,0.4)',
  textShadow: 'rgba(0,0,0,0.6)',
  field: 'rgba(255,255,255,0.12)',
  fieldLine: 'rgba(255,255,255,0.45)',
  ink: '#F3F1E8',
  onSheet: '#F3F1E8',
  onSheetVariant: '#CFD9C6',
  outline: '#9BAA92',
  primary: '#9CBF6B',
  onPrimary: '#10200C',
  primaryEdge: 'rgba(30,55,15,0.5)',
  primaryGlow: 'rgba(156,191,107,0.30)',
  pin: '#9CBF6B',
  onPin: '#10200C',
  link: '#B9D88A',
  error: '#FFB4A8',
  inverseSurface: '#F3F1E8',
  inverseOnSurface: '#0F1B14',
  shadow: '#000000',
};

export type Colors = typeof dark;

const light: Colors = {
  mode: 'light',
  page: '#FBF6EA',
  plain: '#FFFFFF',
  glass: 'rgba(251,246,234,0.80)',
  glassEdge: 'rgba(27,42,51,0.14)',
  glassTop: 'rgba(255,255,255,0.9)',
  glassSolid: 'rgba(251,246,234,0.94)',
  glassButton: 'rgba(27,42,51,0.07)',
  chip: 'rgba(27,42,51,0.06)',
  chipOn: 'rgba(51,174,234,0.18)',
  chipEdge: 'rgba(10,110,168,0.5)',
  track: 'rgba(27,42,51,0.18)',
  lift: '0 14px 32px rgba(27,42,51,0.18), 0 2px 6px rgba(27,42,51,0.12)',
  liftSmall: '0 6px 16px rgba(27,42,51,0.14)',
  textShadow: 'transparent',
  field: 'rgba(27,42,51,0.06)',
  fieldLine: 'rgba(27,42,51,0.45)',
  ink: '#1B2A33',
  onSheet: '#1B2A33',
  onSheetVariant: '#4B5F6B',
  outline: '#7A8C97',
  primary: '#33AEEA',
  onPrimary: '#082433',
  primaryEdge: 'rgba(8,36,51,0.25)',
  primaryGlow: 'rgba(51,174,234,0.32)',
  pin: '#FF6B4A',
  onPin: '#2A0F08',
  link: '#0A6EA8',
  error: '#B3261E',
  inverseSurface: '#1B2A33',
  inverseOnSurface: '#FBF6EA',
  shadow: '#000000',
};

// Screens that sit on a photo (the sign-in) stay dark in both modes so their text stays readable.
const Forced = createContext<Mode | null>(null);
export const ForceMode = Forced.Provider;

export function useColors(): Colors {
  const forced = useContext(Forced);
  const { appearance } = useSettings();
  const mode = forced ?? appearance;
  return mode === 'light' ? light : dark;
}

// Material type roles. Sizes are sp, so they follow the system font size.
export const fonts = {
  wordmark: 'BarlowSemiCondensed_700Bold',
  title: 'BarlowSemiCondensed_600SemiBold',
  body: 'Barlow_400Regular',
  label: 'Barlow_600SemiBold',
  small: 'Barlow_500Medium',
} as const;
