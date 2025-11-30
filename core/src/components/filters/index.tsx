"use client";

import { Input } from "../ui/input";
import { Toggle } from "../ui/toggle";
import { useVariables } from "../variables/context";
import { useFilters } from "./context";
import { Status } from "@/lib/types";
import { Check, RotateCcw, Search, X } from "lucide-react";

export const Filters = () => {
  const { query, setQuery, status, setStatus } = useFilters();
  const { variables, issues } = useVariables();

  const allCount = Object.keys(variables).length;
  const validCount = Object.keys(variables).filter(
    (key) => !issues.some((issue) => issue.path?.includes(key))
  ).length;
  const invalidCount = allCount - validCount;

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search environment variables..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <Toggle
            pressed={status === Status.ALL}
            onPressedChange={() => setStatus(Status.ALL)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            All ({allCount})
          </Toggle>

          <Toggle
            pressed={status === Status.VALID}
            onPressedChange={() => setStatus(Status.VALID)}
            variant="outline"
            size="sm"
            className="gap-2 data-[state=on]:border-green-200 data-[state=on]:bg-green-100 data-[state=on]:text-green-800"
          >
            <Check className="h-3 w-3" />
            Valid ({validCount})
          </Toggle>

          <Toggle
            pressed={status === Status.INVALID}
            onPressedChange={() => setStatus(Status.INVALID)}
            variant="outline"
            size="sm"
            className="gap-2 data-[state=on]:border-red-200 data-[state=on]:bg-red-100 data-[state=on]:text-red-800"
          >
            <X className="h-3 w-3" />
            Invalid ({invalidCount})
          </Toggle>
        </div>
      </div>
    </div>
  );
};
