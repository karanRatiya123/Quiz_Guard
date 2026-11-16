import { Image } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type MarkProps = {
  /** Square edge in dp. The source is 1:1, so width and height always match. */
  size?: number;
  /**
   * Force a variant instead of following the OS scheme. Pass `'ink'` when the
   * mark sits on a light background (e.g. the cream logo tile on the login
   * screen), since the scheme-based asset there would be light-on-light.
   */
  variant?: 'ink' | 'cream';
};

/**
 * The Quiz Guard mark — an 11 × 11 dot field with a negative-space stem.
 *
 * Uses the trimmed artwork (`logo-mark*.png`): the full-canvas version carries
 * enough padding that at app-bar size the field reads as a grey smudge.
 *
 * The asset is 1:1, so it is always laid out square; `contain` then guarantees
 * the aspect ratio survives even if a caller passes a non-square style later.
 *
 * The dots fade from white at the top to grey at the bottom, which only works
 * on ink. Light surfaces therefore use the ink version of the same lattice.
 */
export function Mark({ size = 48, variant }: MarkProps) {
  const colors = useTheme();
  const ink =
    variant === 'ink' ||
    (variant !== 'cream' && !colors.isDark);

  return (
    <Image
      source={ink ? require('../../../assets/logo-mark-light.png') : require('../../../assets/logo-mark.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
