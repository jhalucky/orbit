import type { GeoPoint } from "./types";
import { api } from "@/lib/api";

export class GeolocationError extends Error {
  code: "unsupported" | "denied" | "unavailable" | "timeout";

  constructor(code: GeolocationError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export interface LocationFix extends GeoPoint {
  source: "gps" | "network";
  accuracyM: number | null;
}

const GPS_DENIED = 1;
const GPS_TIMEOUT = 3;

function requestGps(): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new GeolocationError(
          "unsupported",
          "This browser can’t share a GPS position. Pick a neighbourhood instead.",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "gps",
          accuracyM: Number.isFinite(accuracy) ? accuracy : null,
        });
      },
      (error) => {
        if (error.code === GPS_DENIED) {
          reject(
            new GeolocationError(
              "denied",
              "Location access was blocked. Allow it in the browser, or pick a neighbourhood.",
            ),
          );
          return;
        }
        if (error.code === GPS_TIMEOUT) {
          reject(
            new GeolocationError(
              "timeout",
              "That took too long. Try again, or pick a neighbourhood.",
            ),
          );
          return;
        }
        reject(
          new GeolocationError(
            "unavailable",
            "This computer couldn’t get a GPS fix. Pick a neighbourhood instead.",
          ),
        );
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 120_000 },
    );
  });
}

function readCoords(payload: Record<string, unknown>): GeoPoint | null {
  const lat = payload.latitude ?? payload.lat;
  const lng = payload.longitude ?? payload.lng ?? payload.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

async function requestFrom(url: string): Promise<LocationFix> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`Network location failed (${response.status})`);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  if (payload.success === false) {
    throw new Error("Network location failed");
  }
  const point = readCoords(payload);
  if (!point) {
    throw new Error("Network location missing coordinates");
  }
  return { ...point, source: "network", accuracyM: null };
}

async function requestNetwork(): Promise<LocationFix> {
  const errors: unknown[] = [];
  for (const url of ["https://ipwho.is/", "https://ipapi.co/json/"]) {
    try {
      return await requestFrom(url);
    } catch (error) {
      errors.push(error);
    }
  }
  throw errors[0] ?? new Error("Network location failed");
}

export async function getSilentLocation(): Promise<LocationFix> {
  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" });
      if (status.state === "granted") {
        try {
          return await requestGps();
        } catch {
          // Fall through to a network estimate.
        }
      }
    } catch {
      // Permissions API is missing or blocked; skip GPS.
    }
  }
  try {
    const hint = await api<{ lat: number; lng: number }>("/auth/geo-hint", {
      skipAuthRedirect: true,
    });
    return {
      lat: hint.lat,
      lng: hint.lng,
      source: "network",
      accuracyM: null,
    };
  } catch {
    return requestNetwork();
  }
}

export async function getBrowserLocation(): Promise<LocationFix> {
  try {
    return await requestGps();
  } catch (error) {
    if (error instanceof GeolocationError && error.code === "denied") {
      throw error;
    }
    try {
      return await requestNetwork();
    } catch {
      throw (
        error instanceof GeolocationError
          ? error
          : new GeolocationError(
              "unavailable",
              "This computer couldn’t get a GPS fix. Pick a neighbourhood instead.",
            )
      );
    }
  }
}

export function mapsCheckUrl(point: GeoPoint): string {
  return `https://www.google.com/maps?q=${point.lat},${point.lng}`;
}

export function formatAccuracy(meters: number): string {
  if (meters < 30) return "about 20 m";
  if (meters < 100) return `about ${Math.round(meters / 10) * 10} m`;
  if (meters < 1000) return `about ${Math.round(meters / 50) * 50} m`;
  return `about ${Math.round(meters / 1000)} km`;
}
