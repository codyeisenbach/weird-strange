"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "BLACK FRIDAY SALE — 30% OFF EVERYTHING",
  "FREE SHIPPING ON ORDERS OVER $75",
  "LIMITED EDITION PRINTS — WHILE SUPPLIES LAST",
];

const ROTATE_INTERVAL_MS = 5_000;
// Hysteresis band: reveal once scrolled back above REVEAL_THRESHOLD_PX,
// hide once scrolled past HIDE_THRESHOLD_PX. A single shared threshold
// caused the banner to flicker when scrollY hovered right at the line.
const REVEAL_THRESHOLD_PX = 80;
const HIDE_THRESHOLD_PX = 120;
const SLIDE_DURATION_MS = 300;

export function SaleBanner() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [previousMessageIndex, setPreviousMessageIndex] = useState<
    number | null
  >(null);
  const [visible, setVisible] = useState(true);
  const messageIndexRef = useRef(messageIndex);
  messageIndexRef.current = messageIndex;
  const cleanupTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousMessageIndex(messageIndexRef.current);
      setMessageIndex((current) => (current + 1) % MESSAGES.length);

      clearTimeout(cleanupTimeout.current);
      cleanupTimeout.current = setTimeout(() => {
        setPreviousMessageIndex(null);
      }, SLIDE_DURATION_MS);
    }, ROTATE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(cleanupTimeout.current);
    };
  }, []);

  useEffect(() => {
    let rafId: number | null = null;

    const updateVisibility = () => {
      rafId = null;
      setVisible((prev) => {
        if (window.scrollY <= REVEAL_THRESHOLD_PX) return true;
        if (window.scrollY >= HIDE_THRESHOLD_PX) return false;
        return prev;
      });
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const isSliding = previousMessageIndex !== null;

  return (
    <div
      className={`grid w-full overflow-hidden bg-black transition-[grid-template-rows] duration-300 ease-in-out ${
        visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0">
        <div className="relative flex w-full items-center justify-center overflow-hidden px-4 py-2">
          {isSliding && (
            <p
              className="pointer-events-none absolute font-sans text-sm font-medium tracking-wide text-red-600 [animation:slide-out-left_300ms_ease-in-out_forwards]"
            >
              {MESSAGES[previousMessageIndex]}
            </p>
          )}
          <p
            key={messageIndex}
            className={`font-sans text-sm font-medium tracking-wide text-red-600 ${
              isSliding
                ? "[animation:slide-in-right_300ms_ease-in-out_forwards]"
                : ""
            }`}
          >
            {MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
