/** Formatting helpers — numbers and dates read like a product, not a database. */

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const MONTH_LABELS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

/** 119 → "119", 1400 → "1.4k", 20000 → "20k". Trailing zeros are trimmed. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000) return `${trimZero(value / 1_000_000)}M`;
  if (value >= 10_000) return `${trimZero(value / 1_000)}k`;
  return `${value}`;
}

function trimZero(value: number): string {
  const fixed = value.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

/** "SAT, 14 NOV" — matches the app's uppercase section-label style. */
export function todayLabel(now: Date = new Date()): string {
  return `${DAY_LABELS[now.getDay()]}, ${now.getDate()} ${MONTH_LABELS[now.getMonth()]}`;
}

/** Time-of-day greeting used as the home screen's title. */
export function greetingFor(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
