import type { TextStyle, ViewStyle } from 'react-native';

/** 8pt/4pt spacing rhythm */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

/**
 * Shape scale — consistent rounded corners across the app.
 * Cards use 16–24px radius per the design system.
 */
export const radius = {
  sm: 8,
  control: 12,
  card: 20,
  panel: 24,
  pill: 999,
} as const;

/**
 * Typographic ramp — clean, professional type scale.
 */
export const typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
} satisfies Record<string, TextStyle>;

/** Subtle shadows — used sparingly per the design rules */
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;
