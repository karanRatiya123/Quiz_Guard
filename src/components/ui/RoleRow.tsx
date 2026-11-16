import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

type RoleRowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accentColor: string;
  cardTone: 'light' | 'dark';
  title: string;
  description: string;
  onPress: () => void;
};

/**
 * The two big role cards on the landing screen.
 *
 * `cardTone` decides the whole colour set for the card — cream card with ink
 * text, or iron card with white/cream text. Doing it here keeps the landing
 * screen declarative (`<RoleRow cardTone="dark" ... />`) and means the two
 * cards stay visually identical except for the tone.
 */
export function RoleRow({ icon, accentColor, cardTone, title, description, onPress }: RoleRowProps) {
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);

  const isLight = cardTone === 'light';
  const cardBg = isLight ? colors.cardCream : colors.cardIron;
  const titleColor = isLight ? colors.onCream : colors.text;
  const descColor = isLight ? colors.onCreamMuted : colors.textMuted;
  const iconBg = isLight ? 'rgba(193, 193, 169, 0.35)' : 'rgba(227, 226, 195, 0.15)';
  const iconColor = isLight ? colors.onCream : colors.iconCream;
  const arrowBg = isLight ? colors.onCream : colors.accent;
  const arrowColor = isLight ? '#FFFFFF' : colors.onCream;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${description}`}
      android_ripple={{ color: colors.accentPress, foreground: true }}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: cardBg },
        pressed && Platform.OS !== 'android' && styles.rowPressed,
      ]}
    >
      {/* Icon circle */}
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={26} color={iconColor} />
      </View>

      {/* Vertical divider */}
      <View style={[styles.divider, { backgroundColor: isLight ? 'rgba(39, 39, 39, 0.12)' : 'rgba(227, 226, 195, 0.2)' }]} />

      {/* Text content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.description, { color: descColor }]}>{description}</Text>
      </View>

      {/* Arrow button */}
      <View style={[styles.arrowBox, { backgroundColor: arrowBg }]}>
        <MaterialCommunityIcons name="arrow-right" size={20} color={arrowColor} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    rowPressed: {
      opacity: 0.92,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: radius.control + 8,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      width: 1,
      height: 48,
      marginHorizontal: spacing.md,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: 3,
    },
    title: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '700',
    },
    description: {
      ...typography.footnote,
      lineHeight: 21,
    },
    arrowBox: {
      width: 48,
      height: 48,
      borderRadius: 16,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.sm,
    },
  });
