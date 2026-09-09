import { distanceKm } from "./distance";
import type { Business, GeoPoint } from "./types";

export function filterBusinesses(
  businesses: Business[],
  options: {
    query: string;
    categoryId: string | null;
  },
): Business[] {
  const query = options.query.trim().toLowerCase();

  return businesses.filter((business) => {
    if (options.categoryId && business.categoryId !== options.categoryId) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      business.name,
      business.categoryLabel,
      business.description,
      business.neighborhood,
      ...business.tags,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function sortByDistance(
  businesses: Business[],
  origin: GeoPoint,
): Array<Business & { distanceKm: number }> {
  return businesses
    .map((business) => ({
      ...business,
      distanceKm: distanceKm(origin, business.location),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
