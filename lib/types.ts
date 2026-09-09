export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LocationOption {
  id: string;
  label: string;
  city: string;
  lat: number;
  lng: number;
}

export interface Category {
  id: string;
  label: string;
}

export interface DayHours {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  open: string;
  close: string;
  closed?: boolean;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  description: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  location: GeoPoint;
  neighborhood: string;
  address: string;
  hours: DayHours[];
  typicalResponseMinutes: number;
  monogram: string;
  mark: "fill" | "soft" | "line";
}

export interface ServiceRequest {
  id: string;
  title: string;
  categoryLabel: string;
  businessId: string;
  businessName: string;
  status: RequestStatus;
  /** Short human status shown in the UI, e.g. "Ready for pickup". */
  statusLabel: string;
  updatedAt: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  initials: string;
  neighborhood: string;
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Waiting for reply",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
