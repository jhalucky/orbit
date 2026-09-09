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
  distanceKm?: number | null;
  saved?: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  initials: string;
  roles: string[];
  activeRole: "customer" | "provider" | null;
  locationId: string | null;
  location: LocationOption | null;
  lat: number | null;
  lng: number | null;
  usingDeviceLocation: boolean;
  locationSource: "gps" | "network" | null;
  locationAccuracyM: number | null;
  businessId: string | null;
  businessName: string | null;
  shopComplete: boolean;
}

export interface ConversationSummary {
  id: string;
  businessId: string;
  businessName: string;
  businessMonogram: string;
  customerId: string;
  customerName: string;
  lastMessage: string | null;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string | null;
  mine: boolean;
  body: string;
  kind: string;
  requestId: string | null;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  categoryLabel: string;
  businessId: string;
  businessName: string;
  customerId: string;
  customerName: string;
  conversationId: string | null;
  status: RequestStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderService {
  id?: string;
  name: string;
  description: string;
}

export interface ProviderBusiness {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  description: string;
  tags: string[];
  address: string;
  neighborhood: string;
  city: string;
  locationId: string | null;
  lat: number;
  lng: number;
  hours: DayHours[];
  typicalResponseMinutes: number;
  monogram: string;
  mark: string;
  profileComplete: boolean;
  services: ProviderService[];
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Waiting for reply",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
