import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

type ReduceMotionState = boolean;

/**
 * Tracks the OS "Remove animations" setting.
 *
 * Resolves asynchronously, so it starts `false` — screens should snap their
 * animation values to their end state when this flips to `true`.
 */
export function useReduceMotion(): ReduceMotionState {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
