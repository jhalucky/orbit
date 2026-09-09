"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LOCATION } from "@/lib/seed";
import type { LocationOption } from "@/lib/types";

interface CustomerState {
  location: LocationOption;
  savedIds: Set<string>;
  setLocation: (location: LocationOption) => void;
  toggleSaved: (businessId: string) => void;
  isSaved: (businessId: string) => boolean;
}

const CustomerContext = createContext<CustomerState | null>(null);

const INITIAL_SAVED = new Set(["biz_hemline"]);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationOption>(DEFAULT_LOCATION);
  const [savedIds, setSavedIds] = useState<Set<string>>(INITIAL_SAVED);

  const toggleSaved = useCallback((businessId: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(businessId)) next.delete(businessId);
      else next.add(businessId);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (businessId: string) => savedIds.has(businessId),
    [savedIds],
  );

  const value = useMemo(
    () => ({ location, savedIds, setLocation, toggleSaved, isSaved }),
    [isSaved, location, savedIds, toggleSaved],
  );

  return (
    <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
  );
}

export function useCustomer(): CustomerState {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within CustomerProvider");
  }
  return context;
}
