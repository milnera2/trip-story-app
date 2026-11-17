import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '../theme';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  pad?: number;
  // Sheets and long text sit on a denser pane so the text stays readable.
  strong?: boolean;
};

// Frosted pane: blur, dark tint, a bright top edge like light from above, a soft sheen and a lifted shadow.
export function Glass({ children, style, radius = 24, pad = 0, strong }: Props) {
  const c = useColors();
  return (
    <View style={[{ borderRadius: radius, boxShadow: c.lift }, style]}>
      <View
        style={{
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: c.glassEdge,
          borderTopColor: c.glassTop,
        }}
      >
        <BlurView intensity={strong ? 60 : 40} tint={c.mode} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: strong ? c.glassSolid : c.glass }]} />
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#fff" stopOpacity={0.14} />
              <Stop offset="0.45" stopColor="#fff" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#sheen)" />
        </Svg>
        <View style={{ padding: pad }}>{children}</View>
      </View>
    </View>
  );
}
