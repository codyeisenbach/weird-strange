"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "BLACK FRIDAY SALE — 30% OFF EVERYTHING",
  "FREE SHIPPING ON ORDERS OVER $75",
  "LIMITED EDITION PRINTS — WHILE SUPPLIES LAST",
];

const ROTATE_INTERVAL_MS = 30_000;
const REVEAL_THRESHOLD_PX = 80;

export function SaleBanner() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY <= REVEAL_THRESHOLD_PX);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`grid w-full overflow-hidden bg-black transition-[grid-template-rows] duration-300 ease-in-out ${
        visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0">
        <div className="flex w-full items-center justify-center px-4 py-2">
          <p className="font-sans text-sm font-medium tracking-wide text-red-600">
            {MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
