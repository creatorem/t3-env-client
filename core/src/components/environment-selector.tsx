"use client";

import { useState, useTransition } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { type Environment, reloadEnvironmentVariables } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { RefreshCw, Settings } from "lucide-react";

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

  const handleReload = () => {
    startTransition(async () => {
      try {
        const variables = await reloadEnvironmentVariables(environment);
        onEnvironmentChange?.(environment, variables);
      } catch (error) {
        console.error("Failed to reload environment:", error);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Settings className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm font-medium">
          Environment:
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={environment === "development" ? "default" : "outline"}
          size="sm"
          onClick={() => handleEnvironmentChange("development")}
          disabled={isReloading}
          className={cn(
            "relative",
            environment === "development" && "ring-2 ring-blue-500/20"
          )}
        >
          Development
          {environment === "development" && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 size-2 border-none bg-green-500 p-0"
            />
          )}
        </Button>

        <Button
          variant={environment === "production" ? "default" : "outline"}
          size="sm"
          onClick={() => handleEnvironmentChange("production")}
          disabled={isReloading}
          className={cn(
            "relative",
            environment === "production" && "ring-2 ring-red-500/20"
          )}
        >
          Production
          {environment === "production" && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 size-2 border-none bg-red-500 p-0"
            />
          )}
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReload}
        disabled={isReloading}
        className="gap-2"
      >
        <RefreshCw className={cn("size-4", isReloading && "animate-spin")} />
        Reload
      </Button>

      <div className="text-muted-foreground text-xs">
        {isReloading ? "Loading..." : `Using ${environment} environment`}
      </div>
    </div>
  );
}
