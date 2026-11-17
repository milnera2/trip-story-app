import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleProp, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, useColors } from '../theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'glass';
  small?: boolean;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Every button carries a word. Primary is the warm raised button; glass is the quiet one.
export function ActionButton({ label, onPress, icon, variant = 'primary', small, busy, disabled, style }: ButtonProps) {
  const c = useColors();
  const primary = variant === 'primary';
  const ink = primary ? c.onPrimary : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!busy, busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: small ? 44 : 54,
          borderRadius: 27,
          paddingHorizontal: small ? 16 : 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: primary ? c.primaryEdge : c.glassEdge,
          borderTopColor: primary ? 'rgba(255,255,255,0.55)' : c.glassTop,
          backgroundColor: primary ? c.primary : c.glassButton,
          boxShadow: pressed ? '0 2px 6px rgba(0,0,0,0.4)' : primary ? `0 10px 22px ${c.primaryGlow}, 0 3px 8px rgba(0,0,0,0.3)` : c.liftSmall,
          transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.98 : 1 }],
          opacity: disabled ? 0.5 : 1,
          transitionProperty: 'transform, box-shadow, opacity',
          transitionDuration: '140ms',
        } as object,
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={ink} /> : icon ? <MaterialIcons name={icon} size={small ? 20 : 22} color={ink} /> : null}
      <Text maxFontSizeMultiplier={1.3} style={{ color: ink, fontFamily: fonts.label, fontSize: small ? 15 : 17 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, icon, on, onPress }: { label: string; icon: IconName; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.96 : 1 }],
        transitionProperty: 'transform, background-color, border-color',
        transitionDuration: '160ms',
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: on ? c.primary : c.glassEdge,
        backgroundColor: on ? c.chipOn : c.chip,
      } as object)}
    >
      <MaterialIcons name={icon} size={18} color={on ? c.link : c.onSheetVariant} />
      <Text style={{ color: on ? c.link : c.onSheet, fontFamily: fonts.label, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function TextArea({ label, ...input }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ borderRadius: 12, backgroundColor: c.field, borderBottomWidth: 1, borderBottomColor: c.fieldLine, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
      <Text style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 12 }}>{label}</Text>
      <TextInput
        multiline
        accessibilityLabel={label}
        selectionColor={c.primary}
        cursorColor={c.primary}
        placeholderTextColor={c.outline}
        maxFontSizeMultiplier={1.3}
        style={{ minHeight: 76, color: c.onSheet, fontFamily: fonts.body, fontSize: 17, textAlignVertical: 'top', paddingTop: 4, outlineStyle: 'none' } as object}
        {...input}
      />
    </View>
  );
}

export function Avatar({ name, size = 40, url, ring }: { name: string; size?: number; url?: string | null; ring?: string }) {
  const c = useColors();
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.chipOn,
        borderWidth: ring ? 2 : 1,
        borderColor: ring ?? c.primary,
        overflow: 'hidden',
      }}
    >
      {url ? (
        <Image source={{ uri: url }} accessibilityIgnoresInvertColors style={{ width: size, height: size }} />
      ) : (
        <Text style={{ color: c.link, fontFamily: fonts.title, fontSize: size * 0.45 }}>{initial}</Text>
      )}
    </View>
  );
}

export function Heading({ children, size = 34 }: { children: ReactNode; size?: number }) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={1.2}
      style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: size, lineHeight: size + 4, textShadowColor: c.textShadow, textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } }}
    >
      {children}
    </Text>
  );
}

export function Body({ children, dim, style }: { children: ReactNode; dim?: boolean; style?: object }) {
  const c = useColors();
  return (
    <Text maxFontSizeMultiplier={1.3} style={[{ color: dim ? c.onSheetVariant : c.ink, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 }, style]}>
      {children}
    </Text>
  );
}
