"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "BLACK FRIDAY SALE — 30% OFF EVERYTHING",
  "FREE SHIPPING ON ORDERS OVER $75",
  "LIMITED EDITION PRINTS — WHILE SUPPLIES LAST",
];

const ROTATE_INTERVAL_MS = 5_000;
const REVEAL_THRESHOLD_PX = 80;
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
    const handleScroll = () => {
      setVisible(window.scrollY <= REVEAL_THRESHOLD_PX);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
