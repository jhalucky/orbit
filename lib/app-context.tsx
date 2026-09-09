"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { getBrowserLocation, getSilentLocation, type LocationFix } from "@/lib/geolocation";
import { distanceKm, nearestPoint } from "@/lib/distance";
import type { LocationOption, SessionUser } from "@/lib/types";

const MANUAL_LOCATION_KEY = "orbit_location_manual";
const NEAR_KM = 40;

interface AppState {
  user: SessionUser | null;
  loading: boolean;
  neighbourhoods: LocationOption[];
  location: LocationOption | null;
  usingDeviceLocation: boolean;
  savedIds: Set<string>;
  setLocation: (location: LocationOption, options?: { manual?: boolean }) => void;
  locateMe: () => Promise<void>;
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
  const autoTriedRef = useRef(false);

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

  const usingDeviceLocation = Boolean(user?.usingDeviceLocation);

  const location = useMemo((): LocationOption | null => {
    const place =
      user?.location ??
      neighbourhoods.find((item) => item.id === user?.locationId) ??
      neighbourhoods[0] ??
      null;
    if (!place) return null;

    const lat = user?.lat ?? place.lat;
    const lng = user?.lng ?? place.lng;
    let label = place.label;
    if (user?.usingDeviceLocation && user.lat != null && user.lng != null) {
      const km = distanceKm({ lat: user.lat, lng: user.lng }, place);
      label = km > 20 ? "Near you" : `Near ${place.label}`;
    }
    return { ...place, lat, lng, label };
  }, [neighbourhoods, user]);

  const setLocation = useCallback((next: LocationOption, options?: { manual?: boolean }) => {
    if (options?.manual !== false && typeof window !== "undefined") {
      sessionStorage.setItem(MANUAL_LOCATION_KEY, "1");
    }
    setUser((current) =>
      current
        ? {
            ...current,
            locationId: next.id,
            location: next,
            lat: next.lat,
            lng: next.lng,
            usingDeviceLocation: false,
            locationSource: null,
            locationAccuracyM: null,
          }
        : current,
    );
    void api("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ location_id: next.id }),
    }).catch(() => undefined);
  }, []);

  const applyFix = useCallback(async (point: LocationFix) => {
    const next = await api<SessionUser>("/auth/locate", {
      method: "POST",
      body: JSON.stringify({
        lat: point.lat,
        lng: point.lng,
        source: point.source,
        accuracy_m: point.accuracyM,
      }),
    });
    setUser(next);
  }, []);

  const locateMe = useCallback(async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(MANUAL_LOCATION_KEY);
    }
    const point = await getBrowserLocation();
    await applyFix(point);
  }, [applyFix]);

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
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(MANUAL_LOCATION_KEY);
    }
    autoTriedRef.current = false;
    await api("/auth/logout", { method: "POST", skipAuthRedirect: true });
    setUser(null);
    window.location.replace("/login");
  }, []);

  useEffect(() => {
    if (!user) autoTriedRef.current = false;
  }, [user]);

  useEffect(() => {
    if (loading || !user || neighbourhoods.length === 0) return;
    if (autoTriedRef.current) return;
    autoTriedRef.current = true;
    const savedId = user.locationId;
    const deviceOn = Boolean(user.usingDeviceLocation);
    void (async () => {
      try {
        const point = await getSilentLocation();
        const nearest = nearestPoint(point, neighbourhoods);
        const nearKm = distanceKm(point, nearest);
        const saved = neighbourhoods.find((place) => place.id === savedId);
        const savedKm = saved ? distanceKm(point, saved) : Number.POSITIVE_INFINITY;
        const locked =
          typeof window !== "undefined" &&
          sessionStorage.getItem(MANUAL_LOCATION_KEY) === "1";
        if (locked && saved && savedKm <= NEAR_KM) {
          return;
        }
        if (nearKm <= NEAR_KM) {
          await applyFix(point);
          return;
        }
        if (savedId !== nearest.id || deviceOn) {
          setLocation(nearest, { manual: false });
        }
      } catch {
        // Keep the saved neighbourhood if we cannot estimate a position.
      }
    })();
  }, [applyFix, loading, neighbourhoods, setLocation, user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      neighbourhoods,
      location,
      usingDeviceLocation,
      savedIds,
      setLocation,
      locateMe,
      toggleSaved,
      isSaved,
      refreshUser,
      logout,
    }),
    [
      isSaved,
      loading,
      location,
      locateMe,
      logout,
      neighbourhoods,
      refreshUser,
      savedIds,
      setLocation,
      toggleSaved,
      user,
      usingDeviceLocation,
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
