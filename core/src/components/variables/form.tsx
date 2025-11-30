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
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groups)}>
              {Object.entries(groups).map(([prefix, keys]) => (
                <AccordionItem
                  key={prefix}
                  value={prefix}
                  className="border-t border-b-0"
                >
                  <AccordionTrigger className="px-4 cursor-pointer">
                    <div className="sticky top-0">
                      <span className="capitalize">{prefix.toLowerCase()}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {keys.length} variables
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
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
          <div className="h-9 w-9 min-w-9 flex items-center justify-center rounded-md bg-background border">
            <ServerIcon className="size-4" />
          </div>
        )}
        <FormControl>
          <Input
            placeholder={`Set a value for ${variable.key}`}
            className="font-mono shadow-none bg-background"
            {...field}
          />
        </FormControl>
        {/* <CopyButton className="h-9 w-9 min-w-9" toCopy={field.value} /> */}
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
    // <div className="p-2 first:pt-4">
    <span data-slot="variable" id={variable.key} className="block px-2 py-1 first-of-type:pt-2 last-of-type:pb-2 ">
      <FormField
        key={variable.key}
        control={control}
        name={variable.key}
        render={({ field, fieldState }) => (
          <FormItem
            className="space-y-1 rounded-lg border p-3 bg-muted/50"
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
  
          </FormItem>
        )}
      />
    </span>
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
