import { SortFilterItem } from "lib/constants";
import { Suspense } from "react";
import FilterItemDropdown from "./dropdown";
import { FilterItem } from "./item";

export type ListItem = SortFilterItem | PathFilterItem;
export type PathFilterItem = { title: string; path: string };

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <>
      {list.map((item: ListItem, i) => (
        <FilterItem key={i} item={item} />
      ))}
    </>
  );
}

export default function FilterList({
  list,
  title,
  as = "list",
}: {
  list: ListItem[];
  title?: string;
  as?: "list" | "dropdown";
}) {
  return (
    <>
      <nav>
        {title ? (
          <h3 className="mb-2 text-xs text-ws-charcoal">{title}</h3>
        ) : null}
        {as === "dropdown" ? (
          <Suspense fallback={null}>
            <FilterItemDropdown list={list} />
          </Suspense>
        ) : (
          <ul>
            <Suspense fallback={null}>
              <FilterItemList list={list} />
            </Suspense>
          </ul>
        )}
      </nav>
    </>
  );
}
