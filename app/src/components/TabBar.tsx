import { Pressable, Text, View } from 'react-native';
import { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Glass } from './Glass';
import type { IconName } from './ui';
import { fonts, useColors } from '../theme';

export const TAB_BAR_HEIGHT = 68;

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabs: Record<string, { label: string; icon: IconName }> = {
  map: { label: 'Map', icon: 'map' },
  trips: { label: 'Trips', icon: 'luggage' },
  profile: { label: 'Profile', icon: 'person' },
  settings: { label: 'Settings', icon: 'settings' },
};

// Floating glass bar. Icon and word on every tab so nobody has to guess.
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 10, alignItems: 'center' }}>
      <Glass radius={34} style={{ width: '92%', maxWidth: 440 }}>
        <View style={{ height: TAB_BAR_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 }}>
          {state.routes.map((route, i) => {
            const t = tabs[route.name];
            if (!t) return null;
            const on = state.index === i;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={t.label}
                accessibilityState={{ selected: on }}
                onPress={() => {
                  const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!on && !e.defaultPrevented) navigateToTab(route.key);
                }}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.chipOn : 'transparent',
                  borderWidth: 1,
                  borderColor: on ? c.chipEdge : 'transparent',
                }}
              >
                <MaterialIcons name={t.icon} size={24} color={on ? c.link : c.onSheetVariant} />
                <Text style={{ color: on ? c.link : c.onSheetVariant, fontFamily: fonts.label, fontSize: 12, marginTop: 1 }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}
