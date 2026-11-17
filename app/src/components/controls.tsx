import { ComponentRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useColors } from '../theme';

const ease = { duration: 160 };

export type InputRef = ComponentRef<typeof TextInput>;

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
  secureToggle?: boolean;
};

// Filled text field with a floating label, for use on the glass card.
export const Field = forwardRef<InputRef, FieldProps>(function Field(
  { label, error, helper, secureToggle, value, onFocus, onBlur, ...input },
  ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureToggle);
  const floated = focused || !!value;
  const p = useSharedValue(floated ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(floated ? 1 : 0, ease);
  }, [floated, p]);

  const labelStyle = useAnimatedStyle(() => ({
    top: 19 - 12 * p.value,
    fontSize: 17 - 5 * p.value,
  }));

  const line = error ? c.error : focused ? c.primary : c.fieldLine;
  const labelColor = error ? c.error : focused ? c.primary : c.onSheetVariant;

  return (
    <Animated.View layout={LinearTransition.duration(200).reduceMotion(ReduceMotion.System)}>
      <View style={{ height: 60, borderRadius: 12, backgroundColor: c.field, overflow: 'hidden' }}>
        <TextInput
          ref={ref}
          value={value}
          accessibilityLabel={error ? `${label}, ${error}` : label}
          selectionColor={c.primary}
          cursorColor={c.primary}
          maxFontSizeMultiplier={1.3}
          secureTextEntry={secureToggle ? hidden : input.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            height: 60,
            paddingTop: 22,
            paddingBottom: 4,
            paddingLeft: 16,
            paddingRight: secureToggle ? 52 : 16,
            color: c.onSheet,
            fontFamily: fonts.body,
            fontSize: 17,
            outlineStyle: 'none',
          } as object}
          {...input}
        />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: focused || error ? 2 : 1, backgroundColor: line }} />
        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          importantForAccessibility="no"
          accessibilityElementsHidden
          maxFontSizeMultiplier={1.3}
          style={[{ position: 'absolute', left: 16, color: labelColor, fontFamily: fonts.body }, labelStyle]}
        >
          {label}
        </Animated.Text>
        {secureToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={{ position: 'absolute', right: 4, top: 6, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
            android_ripple={{ color: '#FFFFFF33', radius: 24, borderless: true }}
          >
            <MaterialIcons name={hidden ? 'visibility' : 'visibility-off'} size={24} color={c.onSheetVariant} />
          </Pressable>
        )}
      </View>
      {(error || helper) && (
        <Animated.View
          entering={FadeInDown.duration(160).reduceMotion(ReduceMotion.System)}
          accessibilityLiveRegion="polite"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 4 }}
        >
          {error && <MaterialIcons name="error-outline" size={16} color={c.error} />}
          <Text style={{ color: error ? c.error : c.onSheetVariant, fontFamily: fonts.small, fontSize: 13, lineHeight: 18, flexShrink: 1 }}>
            {error ?? helper}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
});

function useFocusRing() {
  const [focused, setFocused] = useState(false);
  return { focused, onFocus: () => setFocused(true), onBlur: () => setFocused(false) };
}

export function FilledButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  const c = useColors();
  const ring = useFocusRing();
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: !!loading }}
      onFocus={ring.onFocus}
      onBlur={ring.onBlur}
      android_ripple={{ color: c.onPrimary + '33' }}
      style={({ pressed }) => ({
        minHeight: 48,
        minWidth: 120,
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundColor: c.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.88 : 1,
        borderWidth: 2,
        borderColor: ring.focused ? c.link : 'transparent',
        overflow: 'hidden',
      })}
    >
      <Text style={{ color: c.onPrimary, fontFamily: fonts.label, fontSize: 16, letterSpacing: 0.2, opacity: loading ? 0 : 1 }}>{label}</Text>
      {loading && <ActivityIndicator color={c.onPrimary} style={{ position: 'absolute' }} />}
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  const ring = useFocusRing();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      onFocus={ring.onFocus}
      onBlur={ring.onBlur}
      android_ripple={{ color: c.link + '2E' }}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 12,
        marginLeft: -12,
        borderRadius: 24,
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
        borderWidth: 2,
        borderColor: ring.focused ? c.link : 'transparent',
      })}
    >
      <Text style={{ color: c.link, fontFamily: fonts.label, fontSize: 16, letterSpacing: 0.2 }}>{label}</Text>
    </Pressable>
  );
}

export function Snackbar({ message, onClose }: { message: string | null; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(200).reduceMotion(ReduceMotion.System)}
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 16,
        minHeight: 48,
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
        backgroundColor: c.inverseSurface,
        shadowColor: c.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <Text style={{ flex: 1, color: c.inverseOnSurface, fontFamily: fonts.body, fontSize: 15, lineHeight: 20 }}>{message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Close message" onPress={onClose} hitSlop={8} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name="close" size={20} color={c.inverseOnSurface} />
      </Pressable>
    </Animated.View>
  );
}
