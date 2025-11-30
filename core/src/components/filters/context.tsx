"use client";

import { createContext, useContext, useState } from "react";
import { Status } from "@/lib/types";

export type FiltersContextType = {
  query: string;
  setQuery: (query: string) => void;
  status: Status;
  setStatus: (status: Status) => void;
};

export const FiltersContext = createContext<FiltersContextType>({
  query: "",
  setQuery: () => {},
  status: Status.ALL,
  setStatus: () => {},
});

export const FiltersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>(Status.ALL);

  return (
    <FiltersContext.Provider
      value={{
        query,
        setQuery,
        status,
        setStatus,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);

  if (!context) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }

  return context;
};
