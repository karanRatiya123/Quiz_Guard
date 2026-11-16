/**
 * Quiz Guard — Charcoal / Cream / Sage design-system palette.
 *
 * Named swatches:
 *   Healing Springs  #E3E2C3
 *   Swing Sage       #C1C1A9
 *   Heavy Rain       #8B8A87
 *   Iron-ic          #6A6A67
 *   Dire Wolf        #272727
 *   Distinctive Lack of Hue  #141413
 */
export type ThemeColors = {
  /** Background canvas */
  bg: string;
  /** Primary card and grouped content surface */
  surface: string;
  /** Secondary surface for controls, inputs, and list rows */
  surfaceMuted: string;
  /** Subtle separator and border */
  border: string;
  /** Primary text / system label */
  text: string;
  /** Secondary text for descriptions */
  textMuted: string;
  /** Tertiary text for footnotes and placeholders */
  textFaint: string;
  /** The single locked accent color */
  accent: string;
  /** Active press state layer for buttons */
  accentPress: string;
  /** Text & icons placed on accent backgrounds */
  onAccent: string;
  /** Secondary supporting accent */
  secondary: string;
  secondaryPress: string;
  /** System green for positive/active status */
  success: string;
  successPress: string;
  /** System red for errors / warnings */
  error: string;
  errorPress: string;
  /** Dot field / watermark color */
  field: string;
  isDark: boolean;

  /* ── Extended palette for the design system ── */
  /** Hero card and teacher card background */
  cardCream: string;
  /** Student card and secondary button */
  cardIron: string;
  /** Other secondary cards */
  cardSage: string;
  /** Text rendered on cream-colored cards */
  onCream: string;
  /** Muted text on cream-colored cards */
  onCreamMuted: string;
  /** Cream-tinted icons on dark surfaces */
  iconCream: string;
};

/**
 * Dark (default) and light palettes expose the *same* field names, so a
 * component asks for `colors.surface` instead of testing which mode is active.
 * Only the values differ.
 *
 * Names are semantic, not visual: `textMuted` explains intent, while the
 * swatch underneath can change. That is what lets every screen support both
 * modes without a single `if (isDark)` in the JSX.
 *
 * `#FFFFFF` appears here only for maximum contrast (dark-mode text, light-mode
 * canvas); every hue still comes from the six-colour palette above.
 * `isDark` stays in the object because a few places genuinely need to pick a
 * different swatch rather than a different name (see `badgeBackground` in the
 * success sheet).
 */
export const darkColors: ThemeColors = {
  bg: '#141413',
  surface: '#272727',
  surfaceMuted: '#6A6A67',
  border: '#6A6A67',
  text: '#FFFFFF',
  textMuted: '#C1C1A9',
  textFaint: '#8B8A87',
  accent: '#E3E2C3',
  accentPress: 'rgba(227, 226, 195, 0.15)',
  onAccent: '#272727',
  secondary: '#C1C1A9',
  secondaryPress: 'rgba(193, 193, 169, 0.15)',
  success: '#C1C1A9',
  successPress: 'rgba(193, 193, 169, 0.18)',
  error: '#E0886E',
  errorPress: 'rgba(224, 136, 110, 0.18)',
  field: 'rgba(227, 226, 195, 0.06)',
  isDark: true,

  cardCream: '#E3E2C3',
  cardIron: '#6A6A67',
  cardSage: '#C1C1A9',
  onCream: '#272727',
  onCreamMuted: '#6A6A67',
  iconCream: '#E3E2C3',
};

export const lightColors: ThemeColors = {
  bg: '#6A6A67',
  surface: '#E3E2C3',
  surfaceMuted: '#C1C1A9',
  border: '#8B8A87',
  text: '#272727',
  /* Darkened so muted text stays readable on the Iron-ic gray background. */
  textMuted: '#43423F',
  textFaint: '#55544F',
  accent: '#E3E2C3',
  accentPress: 'rgba(227, 226, 195, 0.34)',
  onAccent: '#272727',
  secondary: '#6A6A67',
  secondaryPress: 'rgba(106, 106, 103, 0.16)',
  success: '#6A6A67',
  successPress: 'rgba(106, 106, 103, 0.16)',
  error: '#A2462C',
  errorPress: 'rgba(162, 70, 44, 0.14)',
  field: 'rgba(39, 39, 39, 0.06)',
  isDark: false,

  cardCream: '#E3E2C3',
  cardIron: '#6A6A67',
  cardSage: '#C1C1A9',
  onCream: '#272727',
  onCreamMuted: '#6A6A67',
  iconCream: '#E3E2C3',
};

export type ColorName = keyof ThemeColors;

/**
 * Fixed palette for the teacher login screen, per the approved spec.
 * The login page is always dark regardless of the OS setting, so this
 * palette is used verbatim instead of following `useTheme()`.
 *
 * It is `darkColors` with one override: cream buttons get near-black text
 * (`onAccent`) instead of ink, matching the approved mock.
 *
 * Component mapping:
 *   Screen background    #141413 → bg
 *   Logo background      #E3E2C3 → accent (used as the logo tile)
 *   Main heading         #FFFFFF → text
 *   Description text     #C1C1A9 → textMuted
 *   Input background     #272727 → surface
 *   Input border         #6A6A67 → border
 *   Input icons          #C1C1A9 → textMuted (unfocused icon color)
 *   Google button        #E3E2C3 → accent
 *   Apple button         #6A6A67 → cardIron
 *   Sign In button       #E3E2C3 → accent
 *   Sign In button text  #141413 → onAccent
 *   Remember me checkbox #E3E2C3 → accent
 *   Forgot Password      #C1C1A9 → textMuted
 *   Sign Up link         #E3E2C3 → accent
 */
export const loginColors: ThemeColors = {
  ...darkColors,
  onAccent: '#141413',
};

