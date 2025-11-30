"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import type { Environment } from "@/lib/actions";
import type { Variables } from "@/lib/types";

interface EnvironmentContextType {
  environment: Environment;
  variables: Variables;
  setEnvironment: (env: Environment) => void;
  updateVariables: (variables: Variables) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(
  undefined
);

interface EnvironmentProviderProps {
  children: ReactNode;
  initialEnvironment: Environment;
  initialVariables: Variables;
}

export function EnvironmentProvider({
  children,
  initialEnvironment,
  initialVariables,
}: EnvironmentProviderProps) {
  const [environment, setEnvironment] =
    useState<Environment>(initialEnvironment);
  const [variables, setVariables] = useState<Variables>(initialVariables);

  const updateVariables = (newVariables: Variables) => {
    setVariables(newVariables);
  };

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        variables,
        setEnvironment,
        updateVariables,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error(
      "useEnvironment must be used within an EnvironmentProvider"
    );
  }
  return context;
}
