import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function OpenCart({
  className,
  quantity,
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center text-ws-charcoal transition-colors dark:border-neutral-700">
      <ShoppingCartIcon
        className={clsx(
          "h-5 w-5 transition-transform ease-in-out active:scale-125",
          className,
        )}
      />

      {quantity ? (
        <div className="absolute right-0 top-0 -mr-0.5 -mt-0.5 h-4 w-4 rounded-sm bg-ws-charcoal text-[11px] font-medium text-white">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}
