import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '../theme';

export function Still() {
  const c = useColors();
  const veil = c.mode === 'dark' ? '#06130c' : '#FBF6EA';
  const [top, mid, low] = c.mode === 'dark' ? [0.7, 0.55, 0.85] : [0.86, 0.8, 0.92];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page }]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="stillShade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={veil} stopOpacity={top} />
            <Stop offset="0.5" stopColor={veil} stopOpacity={mid} />
            <Stop offset="1" stopColor={veil} stopOpacity={low} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#stillShade)" />
      </Svg>
    </View>
  );
}
