"use client";

import { useState, useTransition } from "react";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { type Environment, reloadEnvironmentVariables } from "@/lib/actions";

interface EnvironmentSelectorProps {
  currentEnvironment?: Environment;
  onEnvironmentChange?: (environment: Environment, variables: any) => void;
}

export function EnvironmentSelector({
  currentEnvironment = "development",
  onEnvironmentChange,
}: EnvironmentSelectorProps) {
  const [environment, setEnvironment] =
    useState<Environment>(currentEnvironment);
  const [isReloading, startTransition] = useTransition();

  const handleEnvironmentChange = async (newEnv: Environment) => {
    if (newEnv === environment) return;

    setEnvironment(newEnv);

    startTransition(async () => {
      try {
        const variables = await reloadEnvironmentVariables(newEnv);
        onEnvironmentChange?.(newEnv, variables);
      } catch (error) {
        console.error("Failed to switch environment:", error);
        // Reset to previous environment on error
        setEnvironment(environment);
      }
    });
  };

  const handleSelectChange = (value: string) => {
    handleEnvironmentChange(value as Environment);
  };

  return (
    <div className="flex items-center gap-3">
      <Select
        value={environment}
        onValueChange={handleSelectChange}
        disabled={isReloading}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="development">
            <div className="flex items-center gap-2">
              Development
              {environment === "development" && (
                <Badge
                  variant="secondary"
                  className="size-2 border-none bg-green-500 p-0"
                />
              )}
            </div>
          </SelectItem>
          <SelectItem value="production">
            <div className="flex items-center gap-2">
              Production
              {environment === "production" && (
                <Badge
                  variant="secondary"
                  className="size-2 border-none bg-red-500 p-0"
                />
              )}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
