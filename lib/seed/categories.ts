import type { Category } from "../types";

/**
 * Example categories for the first UI.
 * These are not a locked taxonomy — they will come from the database later.
 */
export const CATEGORIES: Category[] = [
  { id: "print-documents", label: "Print & Documents" },
  { id: "repairs", label: "Repairs" },
  { id: "tailoring", label: "Tailoring" },
  { id: "photography", label: "Photography" },
  { id: "home-services", label: "Home Services" },
  { id: "stationery", label: "Stationery" },
  { id: "custom-work", label: "Custom Work" },
  { id: "more", label: "More" },
];
