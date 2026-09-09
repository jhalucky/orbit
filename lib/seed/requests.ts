import type { ServiceRequest } from "../types";

/**
 * Demo requests for the Discover context panel.
 * Not live request data — that arrives with Milestone 4.
 */
export const ACTIVE_REQUESTS: ServiceRequest[] = [
  {
    id: "req_document_set",
    title: "12-page document",
    categoryLabel: "Print & Documents",
    businessId: "biz_corner_copy",
    businessName: "Corner Copy & More",
    status: "PENDING",
    statusLabel: "Waiting for reply",
    updatedAt: "2026-09-09T08:40:00+05:30",
  },
  {
    id: "req_laptop_hinge",
    title: "Laptop hinge repair",
    categoryLabel: "Repairs",
    businessId: "biz_circuit_bench",
    businessName: "Circuit Bench",
    status: "IN_PROGRESS",
    statusLabel: "In progress",
    updatedAt: "2026-09-09T09:05:00+05:30",
  },
  {
    id: "req_passport_photos",
    title: "Passport photos",
    categoryLabel: "Photography",
    businessId: "biz_studio_24",
    businessName: "Studio 24",
    status: "READY",
    statusLabel: "Ready for pickup",
    updatedAt: "2026-09-08T18:20:00+05:30",
  },
];
