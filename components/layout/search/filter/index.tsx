import { SortFilterItem } from "lib/constants";
import { Suspense } from "react";
import FilterItemDropdown from "./dropdown";

export type ListItem = SortFilterItem | PathFilterItem;
export type PathFilterItem = { title: string; path: string };

export default function FilterList({
  list,
  title,
}: {
  list: ListItem[];
  title?: string;
}) {
  return (
    <>
      <nav>
        {title ? (
          <h3 className="mb-2 text-xs text-ws-charcoal">{title}</h3>
        ) : null}
        <Suspense fallback={null}>
          <FilterItemDropdown list={list} />
        </Suspense>
      </nav>
    </>
  );
}
