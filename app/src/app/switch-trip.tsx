import { Pressable, Text, View } from 'react-native';
import { useLeave } from '../leave';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Sheet } from '../components/Sheet';
import { ActionButton, Body } from '../components/ui';
import { plural } from '../format';
import { useTrips } from '../store';
import { fonts, useColors } from '../theme';

export default function SwitchTrip() {
  const c = useColors();
  const router = useRouter();
  const leave = useLeave();
  const { trips, active, setActiveId } = useTrips();
  return (
    <Sheet title="Your trips" onClose={() => leave()}>
      {trips.length === 0 ? <Body dim>No trips yet.</Body> : null}
      {trips.map((t) => {
        const on = t.id === active?.id;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${t.title}, ${plural(t.stop_count, 'stop')}`}
            onPress={() => {
              setActiveId(t.id);
              leave();
            }}
            style={{
              minHeight: 60,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: on ? c.primary : c.glassEdge,
              backgroundColor: on ? c.chipOn : c.chip,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.title, fontSize: 20 }}>
                {t.title}
              </Text>
              <Text style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 14 }}>{plural(t.stop_count, 'stop')}</Text>
            </View>
            {on ? <MaterialIcons name="check" size={22} color={c.link} /> : null}
          </Pressable>
        );
      })}
      <ActionButton label="New trip" icon="add" variant="glass" onPress={() => router.replace('/new-trip')} />
    </Sheet>
  );
}
