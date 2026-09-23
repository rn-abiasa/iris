import { useEffect, useRef, useState } from "react";

/**
 * Types `text` out one character at a time, then calls `onComplete` once.
 *
 * Uses requestAnimationFrame with elapsed-time-based progress (not
 * setInterval) so it stays smooth and battery-friendly on mobile, and
 * keeps ticking correctly even if the tab/browser throttles timers.
 *
 * Deliberately does NOT special-case prefers-reduced-motion: this
 * animation is the whole point of the page it's used on, and many phones
 * report that media query as true (low-power mode, some OEM defaults)
 * which was previously making the text appear instantly with no typing
 * effect at all on mobile.
 */
export default function Typewriter({
  text,
  as: Tag = "p",
  className = "",
  speed = 40,
  startDelay = 0,
  onComplete,
  cursor = true,
}) {
  const [count, setCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setCount(0);
    let rafId;
    let startTime = null;
    let firedComplete = false;

    const tick = (now) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime - startDelay;
      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const next = Math.min(text.length, Math.floor(elapsed / speed) + 1);
      setCount(next);
      if (next >= text.length) {
        if (!firedComplete) {
          firedComplete = true;
          onCompleteRef.current?.();
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [text, speed, startDelay]);

  const shown = text.slice(0, count);
  const done = count >= text.length;

  return (
    <Tag className={className}>
      {shown}
      {cursor && (
        <span
          aria-hidden="true"
          className={`ml-0.5 inline-block w-[2px] translate-y-[0.15em] bg-current ${
            done ? "opacity-0" : "animate-[blink_1s_steps(1)_infinite]"
          }`}
          style={{ height: "1em" }}
        />
      )}
    </Tag>
  );
}
