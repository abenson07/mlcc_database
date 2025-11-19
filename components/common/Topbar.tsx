import { ChangeEvent } from "react";
import { FunnelIcon, MagnifyingGlassIcon } from "../icons";
import Button from "./Button";

type SortOption = {
  label: string;
  value: string;
};

type TopbarProps = {
  title: string;
  ctaLabel?: string;
  onAdd?: () => void;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  sortOptions?: SortOption[];
  onSortChange?: (value: string) => void;
};

const Topbar = ({
  title,
  ctaLabel,
  onAdd,
  onSearch,
  searchPlaceholder = "Search...",
  sortOptions,
  onSortChange
}: TopbarProps) => {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearch?.(event.target.value);
    // TODO: Connect search input to API query or client-side filtering
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSortChange?.(event.target.value);
    // TODO: Wire sort dropdown to server-side or client-side sorting
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-primary-800">{title}</h2>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              className="w-64 rounded-md border border-primary-300 bg-cream-100 py-2 pl-9 pr-3 text-sm text-neutral-700 shadow-sm placeholder:text-neutral-500 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-1"
              placeholder={searchPlaceholder}
              onChange={handleSearch}
            />
          </div>
          {sortOptions && sortOptions.length > 0 && (
            <div className="relative">
              <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <select
                className="relative w-40 appearance-none rounded-md border border-primary-300 bg-cream-100 py-2 pl-9 pr-8 text-sm text-neutral-700 shadow-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-1"
                onChange={handleSortChange}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                ▾
              </span>
            </div>
          )}
        </div>
        {ctaLabel && (
          <Button variant="primary" size="md" onClick={onAdd}>
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Topbar;

