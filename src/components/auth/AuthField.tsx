import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import type { ThemeColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type AuthFieldProps = Omit<TextInputProps, 'style'> & {
  /** Small uppercase label above the field. Also read by screen readers. */
  label: string;
  icon: IconName;
  /** Rendered on the right edge of the field, e.g. a unit or a clear button. */
  trailing?: ReactNode;
  /**
   * `overline` (default) is the small uppercase caption label;
   * `heading` is a large sentence-case title, used on the login design.
   */
  labelVariant?: 'overline' | 'heading';
  /** Shell height in px. Defaults to 50. */
  height?: number;
  /** Override the OS palette, e.g. the fixed login palette. */
  palette?: ThemeColors;
};

/**
 * One labelled input.
 *
 * The label sits outside the field rather than floating inside it: a floating
 * label that shrinks on focus is an iOS pattern that behaves badly with
 * Android's IME, and it makes the field taller for no gain.
 *
 * Password fields get their own visibility toggle, so callers just pass
 * `secureTextEntry` and never re-implement the eye.
 */
export function AuthField({
  label,
  icon,
  trailing,
  secureTextEntry,
  labelVariant = 'overline',
  height = 50,
  palette,
  onFocus,
  onBlur,
  ...inputProps
}: AuthFieldProps) {
  const ctx = useTheme();
  const colors = useMemo(() => palette ?? ctx, [palette, ctx]);
  const styles = useMemo(
    () => createStyles(colors, labelVariant, height),
    [colors, labelVariant, height],
  );
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.shell, focused && styles.shellFocused]}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={focused ? colors.text : colors.textMuted}
        />

        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          secureTextEntry={isPassword && !revealed}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.text}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={styles.input}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={12}
            style={styles.trailing}
          >
            <MaterialCommunityIcons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : (
          trailing
        )}
      </View>
    </View>
  );
}

const createStyles = (
  colors: ThemeColors,
  labelVariant: NonNullable<AuthFieldProps['labelVariant']>,
  height: number,
) =>
  StyleSheet.create({
    field: {
      gap: labelVariant === 'heading' ? 8 : 6,
    },
    label: {
      marginLeft: 2,
      fontSize: labelVariant === 'heading' ? 16 : 11,
      lineHeight: labelVariant === 'heading' ? 20 : 14,
      fontWeight: '600',
      letterSpacing: labelVariant === 'heading' ? 0 : 0.9,
      textTransform: labelVariant === 'heading' ? 'none' : 'uppercase',
      color: labelVariant === 'heading' ? colors.text : colors.textFaint,
    },
    shell: {
      height,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      paddingHorizontal: 16,
      borderRadius: labelVariant === 'heading' ? radius.pill : radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    shellFocused: {
      borderWidth: 1.5,
      borderColor: colors.text,
    },
    input: {
      flex: 1,
      height: '100%',
      paddingVertical: 0,
      fontSize: 15,
      color: colors.text,
    },
    trailing: {
      padding: spacing.xs,
      marginRight: -spacing.xs,
    },
  });
