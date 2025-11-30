"use client";

import { Toggle } from "./ui/toggle";
import { cn } from "@/lib/utils";
import { Check, RotateCcw, X } from "lucide-react";

export type FilterType = "all" | "valid" | "invalid";

interface FilterButtonsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  validCount: number;
  invalidCount: number;
  totalCount: number;
  className?: string;
}

export function FilterButtons({
  activeFilter,
  onFilterChange,
  validCount,
  invalidCount,
  totalCount,
  className,
}: FilterButtonsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Toggle
        pressed={activeFilter === "all"}
        onPressedChange={() => onFilterChange("all")}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RotateCcw className="h-3 w-3" />
        All ({totalCount})
      </Toggle>

      <Toggle
        pressed={activeFilter === "valid"}
        onPressedChange={() => onFilterChange("valid")}
        variant="outline"
        size="sm"
        className="gap-2 data-[state=on]:border-green-200 data-[state=on]:bg-green-100 data-[state=on]:text-green-800"
      >
        <Check className="h-3 w-3" />
        Valid ({validCount})
      </Toggle>

      <Toggle
        pressed={activeFilter === "invalid"}
        onPressedChange={() => onFilterChange("invalid")}
        variant="outline"
        size="sm"
        className="gap-2 data-[state=on]:border-red-200 data-[state=on]:bg-red-100 data-[state=on]:text-red-800"
      >
        <X className="h-3 w-3" />
        Invalid ({invalidCount})
      </Toggle>
    </div>
  );
}
