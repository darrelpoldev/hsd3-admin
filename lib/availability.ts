import { fromZonedTime } from "date-fns-tz";

export const SHOP_TIME_ZONE = "America/Winnipeg";

const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export type TimeWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type DayOpeningHours = {
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

export function parseWallClockToMinutes(wallClock: string): number {
  const [hours, minutes] = wallClock.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(`Unparseable wall-clock time: ${wallClock}`);
  }

  return hours * MINUTES_PER_HOUR + minutes;
}

export function candidateStartHours({
  opensAt,
  closesAt,
  totalDurationHours,
}: {
  opensAt: string;
  closesAt: string;
  totalDurationHours: number;
}): number[] {
  const opensAtMinutes = parseWallClockToMinutes(opensAt);
  const closesAtMinutes = parseWallClockToMinutes(closesAt);
  const durationMinutes = totalDurationHours * MINUTES_PER_HOUR;

  const firstHour = Math.ceil(opensAtMinutes / MINUTES_PER_HOUR);
  const lastHour = Math.floor(
    (closesAtMinutes - durationMinutes) / MINUTES_PER_HOUR,
  );

  const startHours: number[] = [];

  for (let hour = firstHour; hour <= lastHour; hour += 1) {
    startHours.push(hour);
  }

  return startHours;
}

export function toShopInstant(day: string, hour: number): Date {
  const paddedHour = String(hour).padStart(2, "0");

  return fromZonedTime(`${day}T${paddedHour}:00:00`, SHOP_TIME_ZONE);
}

export function addHours(instant: Date, hours: number): Date {
  return new Date(instant.getTime() + hours * MILLISECONDS_PER_HOUR);
}

export function weekdayOf(day: string): number {
  const [year, month, dayOfMonth] = day.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay();
}

export function nextDay(day: string): string {
  const [year, month, dayOfMonth] = day.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, dayOfMonth + 1))
    .toISOString()
    .slice(0, 10);
}

export function shopDayBounds(day: string): TimeWindow {
  return {
    startsAt: toShopInstant(day, 0),
    endsAt: toShopInstant(nextDay(day), 0),
  };
}

export function overlapsAny(
  candidate: TimeWindow,
  blocking: readonly TimeWindow[],
): boolean {
  return blocking.some(
    (booked) =>
      candidate.startsAt < booked.endsAt && booked.startsAt < candidate.endsAt,
  );
}

export function openStartTimes({
  day,
  openingHours,
  totalDurationHours,
  blocking,
  notBefore,
  notAfter,
}: {
  day: string;
  openingHours: DayOpeningHours;
  totalDurationHours: number;
  blocking: readonly TimeWindow[];
  notBefore: Date;
  notAfter: Date;
}): Date[] {
  if (openingHours.isClosed || totalDurationHours <= 0) {
    return [];
  }

  const candidates = candidateStartHours({
    opensAt: openingHours.opensAt,
    closesAt: openingHours.closesAt,
    totalDurationHours,
  });

  return candidates
    .map((hour) => toShopInstant(day, hour))
    .filter((startsAt) => {
      if (startsAt < notBefore || startsAt > notAfter) {
        return false;
      }

      return !overlapsAny(
        { startsAt, endsAt: addHours(startsAt, totalDurationHours) },
        blocking,
      );
    });
}
