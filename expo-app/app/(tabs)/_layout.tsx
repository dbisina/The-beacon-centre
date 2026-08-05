import React from 'react';
import { View, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { colors, radius, shadow, useResponsive, font, HIT } from '@/theme';
import { Text } from '@/components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home-outline' },
  { name: 'watch', label: 'Watch', icon: 'play-circle-outline' },
  { name: 'listen', label: 'Listen', icon: 'headset-outline' },
  { name: 'give', label: 'Give', icon: 'heart-outline' },
  { name: 'news', label: 'News', icon: 'send-outline' },
];

/**
 * Floating pill tab bar.
 *
 * It sits above the safe-area bottom inset, so it clears the iPhone home
 * indicator, Android 3-button navigation and Android gesture bar without any
 * per-OS branching. Only the active tab shows its label — that keeps five
 * tabs comfortable even on a 360dp Galaxy A-series screen.
 */
function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const bottom = Math.max(insets.bottom, r.s(14));

  return (
    <View
      style={[
        {
          position: 'absolute',
          left: r.s(14),
          right: r.s(14),
          bottom,
          maxWidth: r.contentWidth,
          alignSelf: 'center',
          height: r.s(62),
          borderRadius: radius.lg,
          backgroundColor: colors.ink,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: r.s(8),
        },
        shadow.float,
      ]}
    >
      {state.routes.map((route: any, i: number) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === i;

        const onPress = () => {
          if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            hitSlop={6}
            style={{
              minHeight: HIT,
              minWidth: focused ? undefined : HIT,
              paddingHorizontal: focused ? r.s(14) : r.s(6),
              paddingVertical: r.s(9),
              borderRadius: radius.sm,
              backgroundColor: focused ? colors.teal : 'transparent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: r.s(7),
            }}
          >
            <Ionicons
              name={tab.icon}
              size={r.s(20)}
              color={focused ? colors.tealInk : '#6C6862'}
            />
            {focused ? (
              <Text size={12} weight="bold" color={colors.tealInk}>
                {tab.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ground }, animation: 'shift' }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}
