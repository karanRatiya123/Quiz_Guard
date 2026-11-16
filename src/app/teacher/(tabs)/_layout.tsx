import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';

/**
 * Layout for the three teacher tabs.
 *
 * Expo Router derives tabs from `<Tabs.Screen name="...">`, where `name` is the
 * file name in this folder (`index` → Home). The custom `tabBar` replaces the
 * default bottom bar with the floating capsule; the navigator still owns the
 * state, so tab switching, back behaviour and accessibility are unchanged.
 */
export default function TeacherTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
