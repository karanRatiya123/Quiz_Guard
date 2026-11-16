import type { ThemeColors } from '@/constants/colors';

/**
 * Derived colours for the student exam flow.
 *
 * The app palette is semantic (`surface`, `text`, `accent`…), but the exam
 * screens need a few shades it does not name: selected-row tints, the modal
 * scrim, and the faint lines in the ambient backdrop.
 *
 * They live here instead of in each screen so all four student surfaces agree.
 * The important rule is that cream is only used as *text* on ink: on a cream
 * card in light mode it would disappear, so accent text and borders fall back
 * to ink there. Filled cream buttons keep using `accent`/`onAccent` directly.
 */
export type StudentTints = {
  /** Accent-coloured text/icon on a card. Ink in light mode. */
  accentText: string;
  /** Accent-coloured border on a card. Subtle in light mode. */
  accentBorder: string;
  /** Small badge/chip inset inside a card (timer-adjacent labels, Q badges). */
  inset: string;
  /** Selected option or luck card fill. */
  fillSoft: string;
  /** Answered palette items, progress badges, status pills. */
  fillMedium: string;
  /** Progress bar fill; the cream accent vanishes on a cream track. */
  progress: string;
  /** Modal backdrop. */
  scrim: string;
  /** Backdrop hairlines. */
  line: string;
  lineStrong: string;
  /** Ambient glow behind the exam content. */
  glow: string;
  /** Backdrop dot matrix. */
  dot: string;
};

export function getStudentTints(colors: ThemeColors): StudentTints {
  return {
    accentText: colors.isDark ? colors.accent : colors.text,
    accentBorder: colors.isDark ? colors.accent : colors.border,
    // Dark mode keeps the near-black inset; light mode uses sage so dark
    // labels stay readable instead of sitting on an iron block.
    inset: colors.isDark ? colors.bg : colors.surfaceMuted,
    fillSoft: colors.isDark ? 'rgba(227, 226, 195, 0.08)' : 'rgba(39, 39, 39, 0.045)',
    fillMedium: colors.isDark ? 'rgba(227, 226, 195, 0.12)' : 'rgba(39, 39, 39, 0.08)',
    progress: colors.isDark ? colors.accent : colors.text,
    scrim: colors.isDark ? 'rgba(20, 20, 19, 0.78)' : 'rgba(20, 20, 19, 0.55)',
    line: colors.isDark ? 'rgba(227, 226, 195, 0.05)' : 'rgba(39, 39, 39, 0.055)',
    lineStrong: colors.isDark ? 'rgba(227, 226, 195, 0.06)' : 'rgba(39, 39, 39, 0.07)',
    glow: colors.isDark ? 'rgba(227, 226, 195, 0.06)' : 'rgba(193, 193, 169, 0.22)',
    // Cream dots read on both canvases; iron dots would vanish in light mode
    // because the light canvas is Iron-ic.
    dot: colors.accent,
  };
}
