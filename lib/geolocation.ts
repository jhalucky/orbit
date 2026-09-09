import type { GeoPoint } from "./types";

/**
 * Browser geolocation helper.
 * Prepared for a later milestone. Discover currently uses a manual location.
 */
export function getBrowserLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
    );
  });
}
