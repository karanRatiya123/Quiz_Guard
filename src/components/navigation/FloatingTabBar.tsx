import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, shadows, spacing } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * The bar is always ink — in light and dark mode — built only from the app
 * palette. The selected tab becomes a raised dark card with a thin Iron-ic
 * ring, its icon and lowercase label inside; the others show a muted icon.
 */
const BAR_INK = '#1C1C1B'; // Deep Dire Wolf
const BAR_BORDER = 'rgba(227, 226, 195, 0.10)'; // faint Healing Springs ring
const ICON_MUTED = '#C1C1A9'; // Swing Sage
const CARD_BG = '#2E2E2C'; // raised Dire Wolf
const CARD_BORDER = '#6A6A67'; // Iron-ic
const CARD_FG = '#E3E2C3'; // Healing Springs
const ITEM_PRESSED = 'rgba(227, 226, 195, 0.08)';

const BAR_HEIGHT = 64;
const BOTTOM_GAP = 16;

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  upload: { active: 'cloud-upload', inactive: 'cloud-upload-outline' },
  profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

/**
 * Bottom padding a screen needs so its content clears the floating bar.
 *
 * The bar is absolutely positioned over the screen (see `layer` below), so the
 * screens cannot know its height from layout. This hook exposes the same
 * numbers the bar uses — safe-area inset + gap + bar height + a little air —
 * which is why every tab screen sets `paddingBottom: barSpace` instead of a
 * hard-coded number that would break on devices with a gesture bar.
 */
export function useFloatingTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + BOTTOM_GAP + BAR_HEIGHT + spacing.md;
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.layer, { bottom: insets.bottom + BOTTOM_GAP }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const icons = ICONS[route.name];

          /**
           * Emit before navigating. This is the standard React Navigation
           * contract: listeners (e.g. "scroll to top", or a guard) can call
           * `preventDefault()`, so we only navigate when nothing blocked it.
           * Skipping the event would break those listeners and deep links.
           */
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              if (process.env.EXPO_OS !== 'web') {
                void Haptics.selectionAsync();
              }
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              android_ripple={{ color: BAR_BORDER }}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              {focused ? (
                <View style={styles.pill}>
                  <MaterialCommunityIcons name={icons.active} size={22} color={CARD_FG} />
                  <Text style={styles.pillLabel} numberOfLines={1} maxFontSizeMultiplier={1.5}>
                    {label}
                  </Text>
                </View>
              ) : (
                <MaterialCommunityIcons name={icons.inactive} size={22} color={ICON_MUTED} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 440,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderRadius: radius.panel,
    borderCurve: 'continuous',
    backgroundColor: BAR_INK,
    borderWidth: 1,
    borderColor: BAR_BORDER,
    ...shadows.modal,
  },
  item: {
    flex: 1,
    minWidth: 44,
    height: 44,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    backgroundColor: ITEM_PRESSED,
  },
  /* Selected tab: a bordered capsule card, like the reference. */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    minWidth: 44,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  pillLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: CARD_FG,
    textTransform: 'lowercase',
  },
});
