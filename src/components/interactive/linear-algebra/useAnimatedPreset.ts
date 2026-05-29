import { useRef, useCallback, useState } from 'react';
import { timer } from 'd3-timer';
import { easeCubicInOut } from 'd3-ease';

interface AnimatedPresetOptions {
  duration?: number;
}

export function useAnimatedPreset<T extends Record<string, number>>(
  getCurrent: () => T,
  setValues: (values: T) => void,
  options: AnimatedPresetOptions = {},
) {
  const { duration = 600 } = options;
  const timerRef = useRef<ReturnType<typeof timer> | null>(null);
  const [animating, setAnimating] = useState(false);

  const applyPreset = useCallback((target: T) => {
    if (timerRef.current) timerRef.current.stop();

    const from = getCurrent();
    const keys = Object.keys(target) as (keyof T)[];
    setAnimating(true);

    timerRef.current = timer((elapsed) => {
      const rawT = Math.min(elapsed / duration, 1);
      const t = easeCubicInOut(rawT);

      const interpolated = {} as T;
      for (const key of keys) {
        const start = from[key] as number;
        const end = target[key] as number;
        (interpolated as Record<string, number>)[key as string] = start + (end - start) * t;
      }
      setValues(interpolated);

      if (rawT >= 1) {
        timerRef.current?.stop();
        setAnimating(false);
      }
    });
  }, [getCurrent, setValues, duration]);

  const snapPreset = useCallback((target: T) => {
    if (timerRef.current) timerRef.current.stop();
    setAnimating(false);
    setValues(target);
  }, [setValues]);

  return { applyPreset, snapPreset, animating };
}
