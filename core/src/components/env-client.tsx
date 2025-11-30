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
import type { Variables as VariablesType } from "@/lib/types";
import { useCallback } from "react";

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
        <div className="bg-muted/20 overflow-hidden rounded-xl border">
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

// Environment selector section component
const EnvironmentSelectorSection = () => {
  const { environment, updateVariables } = useEnvironment();

  const handleEnvironmentChange = (
    newEnvironment: any,
    newVariables: VariablesType
  ) => {
    updateVariables(newVariables);
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <EnvironmentSelector
        currentEnvironment={environment}
        onEnvironmentChange={handleEnvironmentChange}
      />
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
        <EnvironmentSelectorSection />
        <Filters />
  
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Variables />
          <CodePreview />
        </div>
      </div>
    </VariablesProvider>
  );
};
