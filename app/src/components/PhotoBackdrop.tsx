import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { photos } from '../photos';

const HOLD_MS = 3000;
const FADE_MS = 1000;

function Slide({ source, active, still }: { source: number; active: boolean; still: boolean }) {
  const opacity = useSharedValue(active ? 1 : 0);
  const zoom = useSharedValue(1);

  useEffect(() => {
    if (active) {
      opacity.value = withTiming(1, { duration: still ? 0 : FADE_MS });
      zoom.value = still ? 1 : withTiming(1.08, { duration: HOLD_MS + FADE_MS * 2, easing: Easing.linear });
    } else {
      // Stay put until the next photo has fully faded in on top, then reset.
      opacity.value = withDelay(FADE_MS + 100, withTiming(0, { duration: 0 }));
      zoom.value = withDelay(FADE_MS + 100, withTiming(1, { duration: 0 }));
    }
  }, [active, still, opacity, zoom]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: zoom.value }] }));
  return <Animated.Image source={source} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', zIndex: active ? 2 : 1 }, style]} />;
}

// Full-screen photos that crossfade, with a slow zoom. Still when reduced motion is on.
function PhotoBackdropBase() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || photos.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % photos.length), HOLD_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0F1B14' }]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {photos.map((p, i) => (
        <Slide key={i} source={p} active={i === index} still={!!reduceMotion} />
      ))}
      {/* darkens the top and bottom so the text stays readable on bright photos */}
      <Svg style={[StyleSheet.absoluteFill, { zIndex: 3 }]} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0.55} />
            <Stop offset="0.35" stopColor="#000" stopOpacity={0.12} />
            <Stop offset="0.6" stopColor="#000" stopOpacity={0.2} />
            <Stop offset="1" stopColor="#000" stopOpacity={0.6} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#shade)" />
      </Svg>
    </View>
  );
}

export const PhotoBackdrop = memo(PhotoBackdropBase);
