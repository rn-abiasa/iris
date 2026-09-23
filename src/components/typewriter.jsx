import { useEffect, useRef, useState } from "react";

/**
 * Types `text` out one character at a time, then calls `onComplete` once.
 * Respects prefers-reduced-motion (shows the full text immediately).
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
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setShown("");
    setDone(false);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setShown(text);
      setDone(true);
      onCompleteRef.current?.();
      return undefined;
    }

    let i = 0;
    let intervalId;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(intervalId);
          setDone(true);
          onCompleteRef.current?.();
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

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
