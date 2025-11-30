"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Issue, Status, Variables } from "@/lib/types";
import { validate } from "@/lib/validate";
import { type UseFormReturn, useForm } from "react-hook-form";

export const VariablesContext = createContext<VariablesContextType>({
  form: {} as UseFormReturn,
  issues: [],
  variables: {},
  filteredKeys: [],
});

export type VariablesContextType = {
  form: UseFormReturn;
  variables: Variables;
  issues: ReadonlyArray<Issue>;
  filteredKeys: string[];
};

export const VariablesProvider = ({
  children,
  variables,
  searchQuery = "",
  statusFilter = "all" as Status,
}: {
  children: React.ReactNode;
  variables: Variables;
  searchQuery?: string;
  statusFilter?: Status;
}) => {
  const isResettingRef = useRef(false);
  const form = useForm({
    defaultValues: Object.fromEntries(
      Object.entries(variables).map(([key, variable]) => [
        key,
        variable.value || "",
      ])
    ),
  });
  const [issues, setIssues] = useState<VariablesContextType["issues"]>([]);
  const [filteredKeys, setFilteredKeys] = useState(Object.keys(variables));

  const onValidate = useCallback(
    async (data: Record<string, unknown>) => {
      const result = await validate(data);
      console.log({ result });
      setIssues(result.issues ?? []);

      // Clear all previous errors
      form.clearErrors();

      // Set form errors from validation issues
      result.issues?.forEach((issue) => {
        if (issue.path && issue.path.length > 0) {
          const fieldName = String(issue.path[0]);
          form.setError(fieldName, {
            type: "manual",
            message: issue.message,
          });
        }
      });
    },
    [form]
  );

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (!isResettingRef.current) {
        onValidate(data);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, onValidate]);

  const filterByStatus = useCallback(
    (keys: string[], status: Status) => {
      switch (status) {
        case "valid":
          return keys.filter(
            (key) => !issues.some((issue) => issue.path?.includes(key))
          );
        case "invalid":
          return keys.filter((key) =>
            issues.some((issue) => issue.path?.includes(key))
          );
        default:
          return keys;
      }
    },
    [issues]
  );

  const filterByQuery = useCallback(
    (keys: string[], query: string) => {
      if (!query) return keys;

      return keys.filter((key) => {
        const variable = variables[key];
        const description = variable?.description?.toLowerCase() || "";
        return (
          key.toLowerCase().includes(query.toLowerCase()) ||
          description.toLowerCase().includes(query.toLowerCase())
        );
      });
    },
    [variables]
  );

  useEffect(() => {
    setFilteredKeys(
      filterByStatus(
        filterByQuery(Object.keys(variables), searchQuery),
        statusFilter
      )
    );
  }, [filterByStatus, filterByQuery, searchQuery, statusFilter, variables]);

  // Reset form when variables change (environment switch)
  useEffect(() => {
    isResettingRef.current = true;
    const newValues = Object.fromEntries(
      Object.entries(variables).map(([key, variable]) => [
        key,
        variable.value || "",
      ])
    );
    form.reset(newValues);
    isResettingRef.current = false;
  }, [variables, form]);

  // Initial validation
  useEffect(() => {
    const currentValues = form.getValues();
    onValidate(currentValues);
  }, [form, onValidate]);

  return (
    <VariablesContext.Provider
      value={{
        form,
        variables,
        issues,
        filteredKeys,
      }}
    >
      {children}
    </VariablesContext.Provider>
  );
};

export const useVariables = () => {
  const context = useContext(VariablesContext);

  if (!context) {
    throw new Error("useVariables must be used within a VariablesProvider");
  }

  return context;
};

export const useVariable = (key: string) => {
  const { form, variables, issues } = useVariables();

  const variable = key in variables ? variables[key] : null;
  const issue = issues.find((issue) => issue.path?.includes(key));

  const field = form.watch(key);

  return {
    variable,
    issue,
    field,
  };
};
