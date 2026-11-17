import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export function LoginBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="backdrop" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#182E36" />
            <Stop offset="55%" stopColor="#1D3934" />
            <Stop offset="100%" stopColor="#0F1B14" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#backdrop)" />
      </Svg>
    </View>
  );
}
