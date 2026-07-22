"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function Search() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(() => Boolean(searchParams?.get("q")));
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Form
      action="/search"
      className={`relative flex h-11 items-center justify-end transition-all duration-200 ease-in-out ${
        isOpen ? "w-48 xl:w-64" : "w-11"
      }`}
    >
      <input
        ref={inputRef}
        key={searchParams?.get("q")}
        type="text"
        name="q"
        placeholder="Search for products..."
        autoComplete="off"
        defaultValue={searchParams?.get("q") || ""}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`text-md h-full w-full rounded-lg border bg-white pl-4 pr-10 text-ws-charcoal placeholder:text-neutral-500 transition-opacity duration-200 ease-in-out focus:outline-none! focus:ring-0! focus-visible:outline-hidden! focus-visible:ring-0! focus-visible:ring-offset-0! md:text-sm dark:border-neutral-800 dark:bg-transparent dark:placeholder:text-neutral-400 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <button
        type="button"
        aria-label="Search"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className="absolute right-0 top-0 flex h-11 w-11 shrink-0 items-center justify-center text-ws-charcoal"
      >
        <MagnifyingGlassIcon className="h-4 transition-transform ease-in-out active:scale-125" />
      </button>
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="relative flex h-11 w-11 items-center justify-end">
      <div className="absolute right-0 top-0 flex h-11 w-11 shrink-0 items-center justify-center text-ws-charcoal">
        <MagnifyingGlassIcon className="h-4" />
      </div>
    </form>
  );
}
