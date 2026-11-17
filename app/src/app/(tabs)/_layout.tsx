import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSession } from '../../auth';
import { TabBar } from '../../components/TabBar';
import { useColors } from '../../theme';

export default function TabsLayout() {
  const c = useColors();
  const session = useSession();
  if (session.status === 'loading') return <View style={{ flex: 1, backgroundColor: c.page }} />;
  if (session.status === 'signedOut') return <Redirect href="/" />;
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.page } }}>
      <Tabs.Screen name="map" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
