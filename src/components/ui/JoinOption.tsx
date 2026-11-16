import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

type JoinOptionProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
};

export function JoinOption({ icon, title, description, onPress }: JoinOptionProps) {
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${description}`}
      android_ripple={{ color: colors.accentPress, foreground: true }}
      style={({ pressed }) => [
        styles.card,
        pressed && Platform.OS !== 'android' && styles.cardPressed,
      ]}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={26} color={colors.accent} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 2,
    },
    title: {
      ...typography.headline,
      color: colors.text,
    },
    description: {
      ...typography.footnote,
      color: colors.textMuted,
      lineHeight: 18,
    },
  });
