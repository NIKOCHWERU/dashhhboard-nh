import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

/**
 * Hook to animate a single element with a smooth fade-in and slide-up transition.
 */
export function useAnimeFadeIn(delay = 0, duration = 800) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current && typeof window !== "undefined") {
      animate(ref.current, {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: duration,
        delay: delay,
        easing: "easeOutExpo",
      });
    }
  }, [delay, duration]);

  return ref;
}

/**
 * Hook to animate a single element with a scale-in transition.
 */
export function useAnimeScaleIn(delay = 0, duration = 800) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current && typeof window !== "undefined") {
      animate(ref.current, {
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: duration,
        delay: delay,
        easing: "easeOutExpo",
      });
    }
  }, [delay, duration]);

  return ref;
}

/**
 * Function helper to animate child elements using stagger timing.
 * Useful for list items, cards, or table rows.
 */
export function animateStagger(targets: string, delayBase = 40, duration = 700) {
  if (typeof window !== "undefined") {
    animate(targets, {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: stagger(delayBase),
      duration: duration,
      easing: "easeOutExpo",
    });
  }
}
