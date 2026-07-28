"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  className?: string;
  duration?: number;
};

export function AnimatedCounter({
  value,
  className,
  duration = 1_100,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const counter = counterRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!counter || reduceMotion || typeof IntersectionObserver === "undefined") {
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();
        const startedAt = performance.now();
        setDisplayValue(0);

        const update = (now: number) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(Math.round(value * easedProgress));

          if (progress < 1) {
            frame = requestAnimationFrame(update);
          }
        };

        frame = requestAnimationFrame(update);
      },
      { threshold: 0.35 },
    );

    observer.observe(counter);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return (
    <span
      ref={counterRef}
      className={className}
      aria-label={`${value.toLocaleString("pt-BR")} captions no catálogo`}
    >
      {displayValue.toLocaleString("pt-BR")}
    </span>
  );
}
