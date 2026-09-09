"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { LocationOption, SessionUser } from "@/lib/types";

interface AppState {
  user: SessionUser | null;
  loading: boolean;
  neighbourhoods: LocationOption[];
  location: LocationOption | null;
  savedIds: Set<string>;
  setLocation: (location: LocationOption) => void;
  toggleSaved: (businessId: string) => void;
  isSaved: (businessId: string) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [neighbourhoods, setNeighbourhoods] = useState<LocationOption[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const refreshUser = useCallback(async () => {
    try {
      const next = await api<SessionUser>("/auth/me", { skipAuthRedirect: true });
      setUser(next);
      try {
        const places = await api<LocationOption[]>("/neighbourhoods", {
          skipAuthRedirect: true,
        });
        setNeighbourhoods(places);
      } catch {
        setNeighbourhoods([]);
      }
      try {
        const saved = await api<string[]>("/saved", { skipAuthRedirect: true });
        setSavedIds(new Set(saved));
      } catch {
        setSavedIds(new Set());
      }
    } catch {
      setUser(null);
      setSavedIds(new Set());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await api<SessionUser>("/auth/me", { skipAuthRedirect: true });
        if (cancelled) return;
        setUser(next);
        try {
          const places = await api<LocationOption[]>("/neighbourhoods", {
            skipAuthRedirect: true,
          });
          if (!cancelled) setNeighbourhoods(places);
        } catch {
          if (!cancelled) setNeighbourhoods([]);
        }
        try {
          const saved = await api<string[]>("/saved", { skipAuthRedirect: true });
          if (!cancelled) setSavedIds(new Set(saved));
        } catch {
          if (!cancelled) setSavedIds(new Set());
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setSavedIds(new Set());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const location =
    user?.location ??
    neighbourhoods.find((item) => item.id === user?.locationId) ??
    neighbourhoods[0] ??
    null;

  const setLocation = useCallback((next: LocationOption) => {
    setUser((current) =>
      current ? { ...current, locationId: next.id, location: next } : current,
    );
    void api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ location_id: next.id }),
    }).catch(() => undefined);
  }, []);

  const toggleSaved = useCallback(async (businessId: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      const exists = next.has(businessId);
      if (exists) next.delete(businessId);
      else next.add(businessId);
      void api(`/saved/${businessId}`, {
        method: exists ? "DELETE" : "PUT",
      }).catch(() => undefined);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (businessId: string) => savedIds.has(businessId),
    [savedIds],
  );

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST", skipAuthRedirect: true });
    setUser(null);
    window.location.replace("/login");
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      neighbourhoods,
      location,
      savedIds,
      setLocation,
      toggleSaved,
      isSaved,
      refreshUser,
      logout,
    }),
    [
      isSaved,
      loading,
      location,
      logout,
      neighbourhoods,
      refreshUser,
      savedIds,
      setLocation,
      toggleSaved,
      user,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
