/**
 * Shared enter/exit/layout animations for use across the app.
 * Use with Animated.View from react-native-reanimated.
 * Professional timing-based options (no spring) for chat/lists.
 */
import {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  FadeIn,
} from 'react-native-reanimated';

/** Enter: fade in from above with spring (cards, sections). */
export const enterFadeInDown = FadeInDown.springify();

/** Enter with stagger delay for list items (index * baseMs). */
export function enterFadeInDownStagger(index: number, baseMs = 50) {
  return FadeInDown.springify().delay(index * baseMs);
}

/** Enter: fade + slide with timing only (no spring). Professional for lists/chat. */
const ENTER_DURATION_MS = 220;

export const enterFadeInDownTiming = FadeInDown.duration(ENTER_DURATION_MS);

/** Staggered enter with timing (no bounce) for conversation lists, etc. */
export function enterFadeInDownStaggerTiming(index: number, baseMs = 40) {
  return FadeInDown.duration(ENTER_DURATION_MS).delay(index * baseMs);
}

/** Message bubble / inline content: subtle fade only, no movement. */
export const enterMessageFade = FadeIn.duration(180);

/** Exit: fade out upward (step/content transitions). */
export const exitFadeOutUp = FadeOutUp;

/** Layout: smooth resize/position when content changes. */
export const layoutTransition = LinearTransition.springify();

/** Enter: simple fade in (lists, subtle). */
export const enterFadeIn = FadeIn.duration(300);

/** Stagger delay in ms for list item animations (index * 50). */
export function staggerDelay(index: number, baseMs = 50): number {
  return index * baseMs;
}
