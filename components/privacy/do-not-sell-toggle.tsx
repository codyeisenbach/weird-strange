"use client";

import { hasDoNotSellOptOut, setDoNotSellOptOut } from "lib/analytics/cookies";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DoNotSellToggle() {
  const [optedOut, setOptedOut] = useState<boolean | null>(null);

  useEffect(() => {
    setOptedOut(hasDoNotSellOptOut());
  }, []);

  if (optedOut === null) return null;

  return (
    <div className="mt-8 rounded-lg border border-ws-border/20 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">
            {optedOut
              ? "You have opted out of the sale/sharing of your personal information."
              : "Do Not Sell or Share My Personal Information"}
          </p>
          <p className="mt-1 text-sm text-ws-text-muted">
            Opting out stops us from sharing your browsing and purchase activity
            with our advertising and analytics partners (Meta, Reddit, Google).
            This does not affect order processing or transactional emails.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !optedOut;
            setDoNotSellOptOut(next);
            setOptedOut(next);
            toast.success(
              next
                ? "You have been opted out."
                : "You have been opted back in.",
            );
          }}
          className="shrink-0 rounded-full bg-ws-charcoal px-4 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
        >
          {optedOut ? "Opt back in" : "Opt out"}
        </button>
      </div>
    </div>
  );
}
