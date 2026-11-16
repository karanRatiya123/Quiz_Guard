import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Creates a stable `Animated.Value` once per component instance.
 *
 * React Native also exports `useAnimatedValue`; this wrapper keeps the call
 * sites short and gives us one place to swap the implementation later.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const value = useRef(new Animated.Value(initialValue)).current;
  return value;
}
