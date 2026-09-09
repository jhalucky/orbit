import type { LocationOption } from "../types";

/** Demo neighbourhoods. Replace with live location data later. */
export const LOCATIONS: LocationOption[] = [
  {
    id: "koramangala",
    label: "Koramangala",
    city: "Bengaluru",
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    id: "indiranagar",
    label: "Indiranagar",
    city: "Bengaluru",
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    id: "jayanagar",
    label: "Jayanagar",
    city: "Bengaluru",
    lat: 12.9308,
    lng: 77.5838,
  },
  {
    id: "hsr",
    label: "HSR Layout",
    city: "Bengaluru",
    lat: 12.9121,
    lng: 77.6446,
  },
  {
    id: "whitefield",
    label: "Whitefield",
    city: "Bengaluru",
    lat: 12.9698,
    lng: 77.7499,
  },
];

export const DEFAULT_LOCATION = LOCATIONS[0];
