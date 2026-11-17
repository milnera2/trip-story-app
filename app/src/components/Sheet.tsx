import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, ReduceMotion, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from './Glass';
import { fonts, useColors } from '../theme';

// Bottom sheet for the transparent modal routes. Tapping the dim area closes it.
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Animated.View entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(4,12,14,0.6)' }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1 }} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <Animated.View entering={SlideInDown.duration(320).reduceMotion(ReduceMotion.System)} style={{ maxHeight: '90%', maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <Glass strong radius={28} style={{ marginHorizontal: 8, marginBottom: insets.bottom + 8 }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 24, gap: 16 }}>
              <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.glassEdge }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text accessibilityRole="header" style={{ color: c.ink, fontFamily: fonts.wordmark, fontSize: 28 }}>
                  {title}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onClose} hitSlop={10} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="close" size={20} color={c.link} />
                    <Text style={{ color: c.link, fontFamily: fonts.label, fontSize: 16 }}>Cancel</Text>
                  </View>
                </Pressable>
              </View>
              {children}
            </ScrollView>
          </Glass>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
