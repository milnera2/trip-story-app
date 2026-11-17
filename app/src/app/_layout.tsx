import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowSemiCondensed_600SemiBold, BarlowSemiCondensed_700Bold } from '@expo-google-fonts/barlow-semi-condensed';
import { TripsProvider } from '../store';
import { useColors } from '../theme';

const sheet = { presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } } as const;

export default function RootLayout() {
  const c = useColors();
  const [loaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowSemiCondensed_600SemiBold,
    BarlowSemiCondensed_700Bold,
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: c.page }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <TripsProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: c.page } }}>
          <Stack.Screen name="add-stop" options={sheet} />
          <Stack.Screen name="new-trip" options={sheet} />
          <Stack.Screen name="switch-trip" options={sheet} />
        </Stack>
      </TripsProvider>
    </SafeAreaProvider>
  );
}
