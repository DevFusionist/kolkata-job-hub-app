/**
 * Shared enter/exit/layout animations — Bengali Joy edition.
 * Playful, bouncy spring presets for a warm cartoon feel.
 */
import {
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  FadeOutDown,
  LinearTransition,
  FadeIn,
  ZoomIn,
  ZoomOut,
  SlideInRight,
  SlideOutLeft,
  BounceIn,
  LightSpeedInLeft,
} from 'react-native-reanimated';

// ─── Spring configs (bouncier for playful feel) ──────────────────────────────

const SPRING = { damping: 14, stiffness: 220, mass: 0.8 };
const SPRING_BOUNCY = { damping: 10, stiffness: 300, mass: 0.7 };
const SPRING_GENTLE = { damping: 22, stiffness: 160, mass: 1 };

// ─── Enter animations ─────────────────────────────────────────────────────────

/** Enter: fade in from below with bouncy spring (cards, sections). */
export const enterFadeInDown = FadeInDown.springify()
  .damping(SPRING.damping)
  .stiffness(SPRING.stiffness)
  .mass(SPRING.mass);

/** Enter with stagger delay for list items (index * baseMs). */
export function enterFadeInDownStagger(index: number, baseMs = 50) {
  return FadeInDown.springify()
    .damping(SPRING.damping)
    .stiffness(SPRING.stiffness)
    .mass(SPRING.mass)
    .delay(index * baseMs);
}

/** Enter: fade in from above (modals, top content). */
export const enterFadeInUp = FadeInUp.springify()
  .damping(SPRING.damping)
  .stiffness(SPRING.stiffness);

/** Enter: zoom in with playful bounce (hero elements, mascot). */
export const enterZoomIn = ZoomIn.springify()
  .damping(SPRING_BOUNCY.damping)
  .stiffness(SPRING_BOUNCY.stiffness);

/** Enter: slide in from right (page transitions). */
export const enterSlideInRight = SlideInRight.springify()
  .damping(SPRING.damping)
  .stiffness(SPRING.stiffness);

/** Enter: bounce in (success states, empty state icons, mascot). */
export const enterBounceIn = BounceIn.springify()
  .damping(SPRING_BOUNCY.damping)
  .stiffness(SPRING_BOUNCY.stiffness);

/** Enter: light speed (chips, badge reveals). */
export const enterLightSpeed = LightSpeedInLeft.springify()
  .damping(SPRING_GENTLE.damping)
  .stiffness(SPRING_GENTLE.stiffness);

/** Enter: bounce scale for mascot/icon reveals. */
export const enterBounceScale = ZoomIn.springify()
  .damping(8)
  .stiffness(350);

// ─── Timing-based enter (no bounce) for lists / chat ─────────────────────────

const ENTER_DURATION_MS = 220;

export const enterFadeInDownTiming = FadeInDown.duration(ENTER_DURATION_MS);

export function enterFadeInDownStaggerTiming(index: number, baseMs = 40) {
  return FadeInDown.duration(ENTER_DURATION_MS).delay(index * baseMs);
}

/** Message bubble: subtle fade only, no movement. */
export const enterMessageFade = FadeIn.duration(180);

/** Simple fade in (lists, subtle). */
export const enterFadeIn = FadeIn.duration(300);

// ─── Exit animations ──────────────────────────────────────────────────────────

export const exitFadeOutUp = FadeOutUp.springify()
  .damping(SPRING.damping)
  .stiffness(SPRING.stiffness);

export const exitFadeOutDown = FadeOutDown.duration(200);

export const exitZoomOut = ZoomOut.duration(200);

export const exitSlideOutLeft = SlideOutLeft.duration(220);

// ─── Layout animations ────────────────────────────────────────────────────────

export const layoutTransition = LinearTransition.springify()
  .damping(SPRING_GENTLE.damping)
  .stiffness(SPRING_GENTLE.stiffness);

// ─── Stagger helpers ──────────────────────────────────────────────────────────

export function staggerDelay(index: number, baseMs = 50): number {
  return index * baseMs;
}
