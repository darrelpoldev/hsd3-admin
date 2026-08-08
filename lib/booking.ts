import { and, eq, gt, inArray, lt } from "drizzle-orm";

import { db } from "@/db";
import {
  bookingServices,
  bookings,
  customers,
  openingHours,
  services,
  settings,
} from "@/db/schema";

import {
  addHours,
  candidateStartHours,
  openStartTimes,
  shopDayBounds,
  toShopInstant,
  weekdayOf,
  type DayOpeningHours,
  type TimeWindow,
} from "./availability";

import { canTransition, type BookingStatus } from "./booking-status";

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const HOURS_PER_DAY = 24;
const EXCLUSION_VIOLATION = "23P01";

export const BLOCKING_STATUSES = ["pending", "approved", "completed"] as const;

const MAX_CAUSE_DEPTH = 5;

function isExclusionViolation(error: unknown): boolean {
  let current = error;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (typeof current !== "object" || current === null) {
      return false;
    }

    if ((current as { code?: string }).code === EXCLUSION_VIOLATION) {
      return true;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

export type CustomerDetails = {
  name: string;
  address: string;
  phone: string;
  email: string;
  notes: string | null;
};

export type BookingRequest = {
  day: string;
  startHour: number;
  serviceIds: string[];
  customer: CustomerDetails;
};

export type SubmitBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; reason: "no-services" | "closed" | "outside-window" | "taken" };

async function loadSettings() {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));

  if (!row) {
    throw new Error("Booking settings row is missing. Run the seed.");
  }

  return row;
}

async function loadOpeningHours(day: string): Promise<DayOpeningHours | null> {
  const [row] = await db
    .select()
    .from(openingHours)
    .where(eq(openingHours.weekday, weekdayOf(day)));

  return row ?? null;
}

async function loadSelectedServices(serviceIds: string[]) {
  if (serviceIds.length === 0) {
    return [];
  }

  return db.select().from(services).where(inArray(services.id, serviceIds));
}

async function loadBlockingWindows(day: string): Promise<TimeWindow[]> {
  const bounds = shopDayBounds(day);

  return db
    .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt })
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, [...BLOCKING_STATUSES]),
        lt(bookings.startsAt, bounds.endsAt),
        gt(bookings.endsAt, bounds.startsAt),
      ),
    );
}

function bookingLimits(
  now: Date,
  horizonDays: number,
  minNoticeHours: number,
): { notBefore: Date; notAfter: Date } {
  return {
    notBefore: new Date(now.getTime() + minNoticeHours * MILLISECONDS_PER_HOUR),
    notAfter: new Date(
      now.getTime() + horizonDays * HOURS_PER_DAY * MILLISECONDS_PER_HOUR,
    ),
  };
}

export async function listAvailability({
  day,
  serviceIds,
  now,
}: {
  day: string;
  serviceIds: string[];
  now: Date;
}): Promise<Date[]> {
  const [hours, selected, bookingSettings] = await Promise.all([
    loadOpeningHours(day),
    loadSelectedServices(serviceIds),
    loadSettings(),
  ]);

  if (!hours || selected.length === 0) {
    return [];
  }

  const totalDurationHours = selected.reduce(
    (total, service) => total + service.durationHours,
    0,
  );

  const limits = bookingLimits(
    now,
    bookingSettings.horizonDays,
    bookingSettings.minNoticeHours,
  );

  return openStartTimes({
    day,
    openingHours: hours,
    totalDurationHours,
    blocking: await loadBlockingWindows(day),
    notBefore: limits.notBefore,
    notAfter: limits.notAfter,
  });
}

export async function submitBooking(
  request: BookingRequest,
  now: Date,
): Promise<SubmitBookingResult> {
  const [hours, selected, bookingSettings] = await Promise.all([
    loadOpeningHours(request.day),
    loadSelectedServices(request.serviceIds),
    loadSettings(),
  ]);

  if (selected.length === 0) {
    return { ok: false, reason: "no-services" };
  }

  if (!hours || hours.isClosed) {
    return { ok: false, reason: "closed" };
  }

  const totalDurationHours = selected.reduce(
    (total, service) => total + service.durationHours,
    0,
  );

  const fitsOpeningHours = candidateStartHours({
    opensAt: hours.opensAt,
    closesAt: hours.closesAt,
    totalDurationHours,
  }).includes(request.startHour);

  if (!fitsOpeningHours) {
    return { ok: false, reason: "outside-window" };
  }

  const startsAt = toShopInstant(request.day, request.startHour);
  const endsAt = addHours(startsAt, totalDurationHours);
  const limits = bookingLimits(
    now,
    bookingSettings.horizonDays,
    bookingSettings.minNoticeHours,
  );

  if (startsAt < limits.notBefore || startsAt > limits.notAfter) {
    return { ok: false, reason: "outside-window" };
  }

  try {
    const bookingId = await db.transaction(async (tx) => {
      const [customer] = await tx
        .insert(customers)
        .values({
          phone: request.customer.phone,
          name: request.customer.name,
          address: request.customer.address,
          email: request.customer.email,
        })
        .onConflictDoUpdate({
          target: customers.phone,
          set: {
            name: request.customer.name,
            address: request.customer.address,
            email: request.customer.email,
            updatedAt: now,
          },
        })
        .returning({ id: customers.id });

      const [booking] = await tx
        .insert(bookings)
        .values({
          customerId: customer.id,
          startsAt,
          endsAt,
          notes: request.customer.notes,
          status: "pending",
        })
        .returning({ id: bookings.id });

      await tx.insert(bookingServices).values(
        selected.map((service) => ({
          bookingId: booking.id,
          serviceId: service.id,
          name: service.name,
          price: service.price,
          durationHours: service.durationHours,
        })),
      );

      return booking.id;
    });

    return { ok: true, bookingId };
  } catch (error) {
    if (isExclusionViolation(error)) {
      return { ok: false, reason: "taken" };
    }

    throw error;
  }
}

export async function listBookingsForDay(day: string) {
  const bounds = shopDayBounds(day);

  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      notes: bookings.notes,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
      customerEmail: customers.email,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(
      and(
        lt(bookings.startsAt, bounds.endsAt),
        gt(bookings.endsAt, bounds.startsAt),
      ),
    )
    .orderBy(bookings.startsAt);

  if (rows.length === 0) {
    return [];
  }

  const lines = await db
    .select()
    .from(bookingServices)
    .where(
      inArray(
        bookingServices.bookingId,
        rows.map((row) => row.id),
      ),
    );

  return rows.map((row) => ({
    ...row,
    services: lines.filter((line) => line.bookingId === row.id),
  }));
}

export type DayBooking = Awaited<
  ReturnType<typeof listBookingsForDay>
>[number];

export async function changeBookingStatus(
  bookingId: string,
  nextStatus: BookingStatus,
): Promise<{ ok: boolean }> {
  const [booking] = await db
    .select({ status: bookings.status })
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking || !canTransition(booking.status, nextStatus)) {
    return { ok: false };
  }

  try {
    await db
      .update(bookings)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  } catch (error) {
    if (isExclusionViolation(error)) {
      return { ok: false };
    }

    throw error;
  }

  return { ok: true };
}

export async function rescheduleBooking({
  bookingId,
  day,
  startHour,
}: {
  bookingId: string;
  day: string;
  startHour: number;
}): Promise<{ ok: boolean; reason?: "unknown" | "closed" | "outside-window" | "taken" }> {
  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return { ok: false, reason: "unknown" };
  }

  const [hours, lines] = await Promise.all([
    loadOpeningHours(day),
    db
      .select({ durationHours: bookingServices.durationHours })
      .from(bookingServices)
      .where(eq(bookingServices.bookingId, bookingId)),
  ]);

  if (!hours || hours.isClosed) {
    return { ok: false, reason: "closed" };
  }

  const totalDurationHours = lines.reduce(
    (total, line) => total + line.durationHours,
    0,
  );

  const fitsOpeningHours = candidateStartHours({
    opensAt: hours.opensAt,
    closesAt: hours.closesAt,
    totalDurationHours,
  }).includes(startHour);

  if (!fitsOpeningHours) {
    return { ok: false, reason: "outside-window" };
  }

  const startsAt = toShopInstant(day, startHour);

  try {
    await db
      .update(bookings)
      .set({
        startsAt,
        endsAt: addHours(startsAt, totalDurationHours),
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
  } catch (error) {
    if (isExclusionViolation(error)) {
      return { ok: false, reason: "taken" };
    }

    throw error;
  }

  return { ok: true };
}
