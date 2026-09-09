import type { DayHours } from "./types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAY_TO_DAY: Record<string, DayHours["day"]> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Seed businesses are in Bengaluru. Keep SSR and the browser on the same clock. */
export const BUSINESS_TIMEZONE = "Asia/Kolkata";

function minutesFromMidnight(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatClock(time: string): string {
  const [hoursRaw, minutesRaw] = time.split(":").map(Number);
  const period = hoursRaw >= 12 ? "pm" : "am";
  const hours = hoursRaw % 12 || 12;
  if (minutesRaw === 0) return `${hours}${period}`;
  return `${hours}:${minutesRaw.toString().padStart(2, "0")}${period}`;
}

export function getZonedClock(
  now = new Date(),
  timeZone = BUSINESS_TIMEZONE,
): { day: DayHours["day"]; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    day: WEEKDAY_TO_DAY[weekday] ?? 0,
    minutes: hour * 60 + minute,
  };
}

function hoursForDay(hours: DayHours[], day: DayHours["day"]): DayHours | undefined {
  return hours.find((entry) => entry.day === day);
}

export function getAvailability(
  hours: DayHours[],
  now = new Date(),
): { isOpen: boolean; label: string } {
  const clock = getZonedClock(now);
  const current = hoursForDay(hours, clock.day);

  if (current && !current.closed) {
    const openAt = minutesFromMidnight(current.open);
    const closeAt = minutesFromMidnight(current.close);

    if (clock.minutes >= openAt && clock.minutes < closeAt) {
      return { isOpen: true, label: `Open · until ${formatClock(current.close)}` };
    }

    if (clock.minutes < openAt) {
      return { isOpen: false, label: `Closed · opens ${formatClock(current.open)}` };
    }
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = ((clock.day + offset) % 7) as DayHours["day"];
    const entry = hoursForDay(hours, day);
    if (!entry || entry.closed) continue;

    const dayLabel = offset === 1 ? "tomorrow" : DAY_NAMES[day];
    return {
      isOpen: false,
      label: `Closed · opens ${dayLabel} ${formatClock(entry.open)}`,
    };
  }

  return { isOpen: false, label: "Closed" };
}

export function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `Usually replies in ${minutes} min`;
  if (minutes === 60) return "Usually replies in about an hour";
  if (minutes < 180) return "Usually replies in a couple of hours";
  return "Usually replies in a few hours";
}
