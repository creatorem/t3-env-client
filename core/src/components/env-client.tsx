"use client";

import { useFilters } from "./filters/context";
import { useVariables } from "./variables/context";
import { CodeEditor } from "@/components/code-editor";
import { EnvironmentSelector } from "@/components/environment-selector";
import { useEnvironment } from "@/components/environment/context";
import { Filters } from "@/components/filters";
import { FiltersProvider } from "@/components/filters/context";
import { Variables } from "@/components/variables";
import { VariablesProvider } from "@/components/variables/context";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Variables as VariablesType } from "@/lib/types";
import { Status } from "@/lib/types";
import { useCallback, useState } from "react";
import { Search, RotateCcw, Check, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { writeEnvFile } from "@/lib/actions";

type EnvClientProps = {
  readonly variables: VariablesType;
};

// Constants
const COMMON_SUFFIXES = ["KEY", "SECRET", "TOKEN", "URL", "API", "ID"];
const NEXT_PUBLIC_PREFIX = "NEXT_PUBLIC";
const NODE_ENV_KEY = "NODE_ENV";
const MIN_GROUP_SIZE = 2;

// Helper function to extract environment variable prefix
function extractEnvVarPrefix(key: string): string {
  const parts = key.split("_");
  if (parts.length <= 1) return parts[0] || "";

  let prefix = parts[0];

  // Handle NEXT_PUBLIC_ prefix - look at the next part for actual grouping
  if (prefix === "NEXT" && parts.length > 2 && parts[1] === "PUBLIC") {
    prefix = parts[2];
  }

  return prefix;
}

// Helper function to check if a prefix should be excluded from grouping
function shouldExcludePrefix(prefix: string): boolean {
  return COMMON_SUFFIXES.includes(prefix);
}

// Helper function to categorize variable entries by prefix
function categorizeVariablesByPrefix(entries: [string, string][]) {
  const prefixCounts: Record<string, [string, string][]> = {};
  const ungrouped: [string, string][] = [];

  entries.forEach(([key, value]) => {
    const prefix = extractEnvVarPrefix(key);

    if (shouldExcludePrefix(prefix)) {
      ungrouped.push([key, value]);
      return;
    }

    if (!prefixCounts[prefix]) {
      prefixCounts[prefix] = [];
    }
    prefixCounts[prefix].push([key, value]);
  });

  return { prefixCounts, ungrouped };
}

// Helper function to group variables by common prefixes
function groupVariablesByPrefix(entries: [string, string][]) {
  const groups: Record<string, [string, string][]> = {};
  const { prefixCounts, ungrouped } = categorizeVariablesByPrefix(entries);

  // Only group if there are 2 or more variables with the same prefix
  Object.entries(prefixCounts).forEach(([prefix, vars]) => {
    if (vars.length >= MIN_GROUP_SIZE) {
      groups[prefix] = vars;
    } else {
      ungrouped.push(...vars);
    }
  });

  return { groups, ungrouped };
}

// Helper function to filter out NODE_ENV from form values
function filterFormValues(
  formValues: Record<string, string>
): [string, string][] {
  return Object.entries(formValues).filter(([key]) => key !== NODE_ENV_KEY);
}

// Helper function to format group name
function formatGroupName(prefix: string): string {
  return `# ${prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase()}`;
}

// Helper function to add ungrouped variables to lines
function addUngroupedVariablesToLines(
  lines: string[],
  ungrouped: [string, string][]
) {
  if (ungrouped.length > 0) {
    lines.push("");
    ungrouped.forEach(([key, value]) => {
      lines.push(`${key}=${value || ""}`);
    });
  }
}

// Helper function to add grouped variables to lines
function addGroupedVariablesToLines(
  lines: string[],
  groups: Record<string, [string, string][]>
) {
  Object.entries(groups).forEach(([prefix, vars]) => {
    lines.push("");
    lines.push(formatGroupName(prefix));
    vars.forEach(([key, value]) => {
      lines.push(`${key}=${value || ""}`);
    });
  });
}

// Helper function to determine current variables to use
function getCurrentVariables(
  envVariables: VariablesType,
  fallbackVariables: VariablesType
): VariablesType {
  return Object.keys(envVariables).length > 0
    ? envVariables
    : fallbackVariables;
}

// Generate .env file content from form values
function generateEnvFileContent(formValues: Record<string, string>): string {
  const entries = filterFormValues(formValues);
  const { groups, ungrouped } = groupVariablesByPrefix(entries);
  const lines = ["# Environment Variables"];

  addUngroupedVariablesToLines(lines, ungrouped);
  addGroupedVariablesToLines(lines, groups);

  return lines.join("\n");
}

const CodePreview = () => {
  const { form, variables } = useVariables();
  const envFileContent = generateEnvFileContent(form.getValues());

  const handleVariableClick = useCallback((code: string) => {
    const variableName = Object.keys(variables).find((value) =>
      code.includes(value)
    );
    window.location.href = `#${variableName}`;
  }, []);

  return (
    <div className="relative flex flex-col justify-start">
      <h2 className="text-md text-foreground absolute top-3 -translate-y-full font-semibold">
        File
      </h2>

      <div className="sticky top-0 max-h-screen overflow-auto py-4">
        <div className="bg-muted/50 overflow-hidden rounded-xl border">
          <CodeEditor
            lineClassName="hover:bg-muted rounded-md"
            code={envFileContent}
            onLineClick={handleVariableClick}
          />
        </div>
      </div>
    </div>
  );
};

// Combined environment selector and filters component
const EnvironmentSelectorAndFilters = () => {
  const { environment, updateVariables } = useEnvironment();
  const { query, setQuery, status, setStatus } = useFilters();
  const { variables, issues, form } = useVariables();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEnvironmentChange = (
    newEnvironment: any,
    newVariables: VariablesType
  ) => {
    updateVariables(newVariables);
  };

  const handleUpdateEnvFile = async () => {
    setIsUpdating(true);
    try {
      const formValues = form.getValues();
      const envFileContent = generateEnvFileContent(formValues);
      
      const result = await writeEnvFile(envFileContent);
      
      if (result.success) {
        console.log('Successfully updated .env.local');
        // Could add a toast notification here
      } else {
        console.error('Failed to update .env file:', result.error);
        // Could show error notification here
      }
    } catch (error) {
      console.error('Failed to update .env file:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const allCount = Object.keys(variables).length;
  const validCount = Object.keys(variables).filter(
    (key) => !issues.some((issue) => issue.path?.includes(key))
  ).length;
  const invalidCount = allCount - validCount;

  const handleStatusChange = (value: string) => {
    switch (value) {
      case "all":
        setStatus(Status.ALL);
        break;
      case "valid":
        setStatus(Status.VALID);
        break;
      case "invalid":
        setStatus(Status.INVALID);
        break;
    }
  };

  const getStatusValue = () => {
    switch (status) {
      case Status.ALL:
        return "all";
      case Status.VALID:
        return "valid";
      case Status.INVALID:
        return "invalid";
      default:
        return "all";
    }
  };

  return (
    <div className="bg-background rounded-lg border p-4">
      <div className="space-y-4">
        {/* Filters Row */}
        <div className="flex flex-row items-center gap-4">
          <EnvironmentSelector
            currentEnvironment={environment}
            onEnvironmentChange={handleEnvironmentChange}
          />

          {/* Status Filter Select */}
          <Select value={getStatusValue()} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3 w-3" />
                  All ({allCount})
                </div>
              </SelectItem>
              <SelectItem value="valid">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  Valid ({validCount})
                </div>
              </SelectItem>
              <SelectItem value="invalid">
                <div className="flex items-center gap-2">
                  <X className="h-3 w-3 text-red-600" />
                  Invalid ({invalidCount})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search environment variables..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Update Button */}
          <Button
            onClick={handleUpdateEnvFile}
            variant="default"
            size="sm"
            className="gap-2"
            disabled={isUpdating}
          >
            <Save className="h-4 w-4" />
            {isUpdating ? "Updating..." : "Update .env"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Client = ({ variables }: EnvClientProps) => {
  const { query, status } = useFilters();
  const { variables: envVariables } = useEnvironment();
  const currentVariables = getCurrentVariables(envVariables, variables);

  return (
    <VariablesProvider
      variables={currentVariables}
      searchQuery={query}
      statusFilter={status}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <EnvironmentSelectorAndFilters />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Variables />
          <CodePreview />
        </div>
      </div>
    </VariablesProvider>
  );
};
