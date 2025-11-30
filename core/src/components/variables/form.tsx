"use client";

import { useState } from "react";
import { CopyButton } from "../copy-button";
import { useVariable, useVariables } from "./context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as Root,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EnvVariable, Issue } from "@/lib/types";
import {
  AlertCircle,
  Check,
  Copy,
  Lock,
  ServerIcon,
  ShieldOff,
} from "lucide-react";
import type {
  Control,
  ControllerRenderProps,
  FieldValues,
} from "react-hook-form";

// Group variables by common prefixes, excluding common suffixes
const groupVariablesByPrefix = (keys: string[]) => {
  const commonSuffixes = ["KEY", "SECRET", "TOKEN", "URL", "API", "ID"];
  const groups: Record<string, string[]> = {};
  const ungrouped: string[] = [];

  // First pass: identify potential prefixes
  const prefixCounts: Record<string, string[]> = {};

  keys.forEach((key) => {
    const parts = key.split("_");
    if (parts.length > 1) {
      let prefix = parts[0];

      // Handle NEXT_PUBLIC_ prefix - look at the next part for actual grouping
      if (prefix === "NEXT" && parts.length > 2 && parts[1] === "PUBLIC") {
        prefix = parts[2]; // Use the part after NEXT_PUBLIC_ for grouping
      }

      // Skip if prefix is a common suffix
      if (!commonSuffixes.includes(prefix)) {
        if (!prefixCounts[prefix]) {
          prefixCounts[prefix] = [];
        }
        prefixCounts[prefix].push(key);
      } else {
        ungrouped.push(key);
      }
    } else {
      ungrouped.push(key);
    }
  });

  // Only group if there are 2 or more variables with the same prefix
  Object.entries(prefixCounts).forEach(([prefix, vars]) => {
    if (vars.length >= 2) {
      groups[prefix] = vars;
    } else {
      ungrouped.push(...vars);
    }
  });

  return { groups, ungrouped };
};

export const Form = () => {
  const { form, variables, filteredKeys } = useVariables();

  // Filter out NODE_ENV from display
  const filteredKeysWithoutNodeEnv = filteredKeys.filter(
    (key) => key !== "NODE_ENV"
  );

  if (!filteredKeysWithoutNodeEnv.length) {
    return <Empty />;
  }

  const { groups, ungrouped } = groupVariablesByPrefix(
    filteredKeysWithoutNodeEnv
  );
  const hasGroups = Object.keys(groups).length > 0;

  return (
    <div className="h-full w-full">
      <Root {...form}>
        <form>
          {/* Ungrouped variables */}
          {ungrouped.map((key) => {
            const variable = variables[key];
            if (!variable) return null;

            return (
              <Variable
                key={key}
                variable={{ ...variable, key }}
                control={form.control}
              />
            );
          })}

          {/* Grouped variables */}
          {hasGroups && (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groups).map(([prefix, keys]) => (
                <AccordionItem key={prefix} value={prefix} className="border-t border-b-0">
                  <AccordionTrigger className="capitalize px-4">
                    {prefix.toLowerCase()} ({keys.length} variables)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div>
                      {keys.map((key) => {
                        const variable = variables[key];
                        if (!variable) return null;

                        return (
                          <Variable
                            key={key}
                            variable={{ ...variable, key }}
                            control={form.control}
                          />
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </form>
      </Root>
    </div>
  );
};

const AccessBadge = ({ group }: { group?: "client" | "server" | "shared" }) => {
  if (["client", "shared"].includes(group || "")) {
    return (
      <Badge variant="secondary" className="gap-1">
        <ShieldOff className="size-3" />
        Client
      </Badge>
    );
  }

  if (group === "server") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Lock className="size-3" />
        Server
      </Badge>
    );
  }

  return null;
};

const ValueInput = ({
  variable,
  field,
}: {
  variable: EnvVariable & { key: string };
  field: ControllerRenderProps<FieldValues, string>;
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        {variable.group === "server" && (
          <Badge variant="secondary" className="size-9 gap-1">
            <ServerIcon className="size-4" />
          </Badge>
        )}
        <FormControl>
          <Input
            placeholder={`Set a value for ${variable.key}`}
            className="font-mono"
            {...field}
          />
        </FormControl>
        <CopyButton toCopy={field.value} />
      </div>
    </div>
  );
};

const Variable = ({
  variable,
  control,
}: {
  variable: EnvVariable & { key: string };
  control: Control;
}) => {
  const { issue } = useVariable(variable.key);

  return (
    <FormField
      key={variable.key}
      control={control}
      name={variable.key}
      render={({ field, fieldState }) => (
        <FormItem
          // className="border-b px-4 py-6"
          className="space-y-1 px-4 py-3"
          data-field-name={variable.key}
        >
          <div className="space-y-1">
            <div className="flex justify-start gap-2">
              <FormLabel className="font-mono font-semibold">
                {variable.key}
              </FormLabel>

              <div className="text-muted-foreground text-xs">
                {variable.group}
              </div>
            </div>
            {variable.description && (
              <FormDescription>{variable.description}</FormDescription>
            )}
          </div>
          <ValueInput variable={variable} field={field} />

          <FormMessage />

          {/* <div className="mt-2 flex gap-2">
            <AccessBadge group={variable.group} />
          </div> */}
        </FormItem>
      )}
    />
  );
};

const Empty = () => {
  return (
    <div className="relative flex h-full w-full min-w-0 grow items-center justify-center">
      <p className="text-muted-foreground w-full max-w-md text-center text-balance">
        No variables found. Please add some variables or modify the filters.
      </p>
    </div>
  );
};
