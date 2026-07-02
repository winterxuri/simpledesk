"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function SearchAndFilters({
  search,
  onSearchChange,
  filters,
  actions
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters?: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label: string;
  }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {filters?.map((filter) => (
          <Select
            key={filter.label}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.label}
            className="w-auto min-w-40"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ))}
        {actions}
      </div>
    </div>
  );
}
