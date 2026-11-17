import { Text, View } from 'react-native';
import { Glass } from './Glass';
import { fonts, useColors } from '../theme';
import type { TripMapProps } from './TripMap.types';

// Android and iOS use the native map, which needs a development build. Until that is set up
// this shows a note; the browser version is in TripMap.web.tsx.
export function TripMap({ stops }: TripMapProps) {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.page, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Glass pad={20} style={{ maxWidth: 360 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.title, fontSize: 22 }}>3D map needs a development build</Text>
        <Text style={{ color: c.onSheetVariant, fontFamily: fonts.body, fontSize: 16, lineHeight: 23, marginTop: 6 }}>
          {stops.length} stops are saved on this trip. Open the app in the browser preview to see the map for now.
        </Text>
      </Glass>
    </View>
  );
}
