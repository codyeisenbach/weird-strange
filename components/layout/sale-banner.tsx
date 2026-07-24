"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "BLACK FRIDAY SALE — 30% OFF EVERYTHING",
  "FREE SHIPPING ON ORDERS OVER $75",
  "LIMITED EDITION PRINTS — WHILE SUPPLIES LAST",
];

const ROTATE_INTERVAL_MS = 30_000;

export function SaleBanner() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full items-center justify-center bg-black px-4 py-2">
      <p className="font-sans text-sm font-medium tracking-wide text-red-600">
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
}
