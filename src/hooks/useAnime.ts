import { useRef } from "react";

/**
 * Hook to animate a single element with a smooth fade-in and slide-up transition.
 * (Animations Disabled for Performance)
 */
export function useAnimeFadeIn(delay = 0, duration = 800) {
  const ref = useRef<any>(null);
  return ref;
}

/**
 * Hook to animate a single element with a scale-in transition.
 * (Animations Disabled for Performance)
 */
export function useAnimeScaleIn(delay = 0, duration = 800) {
  const ref = useRef<any>(null);
  return ref;
}

/**
 * Hook to animate a single element sliding in from the LEFT.
 * (Animations Disabled for Performance)
 */
export function useAnimeSlideInLeft(delay = 1000, duration = 1000, trigger = true) {
  const ref = useRef<any>(null);
  return ref;
}

/**
 * Hook to animate a single element sliding in from the RIGHT.
 * (Animations Disabled for Performance)
 */
export function useAnimeSlideInRight(delay = 1000, duration = 1000, trigger = true) {
  const ref = useRef<any>(null);
  return ref;
}

/**
 * Function helper to animate child elements using stagger timing.
 * (Animations Disabled for Performance)
 */
export function animateStagger(targets: string, delayBase = 40, duration = 700) {
  // No-op
}
