import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });

const { db } = await import("@/db");
const { bookingServices, bookings, customers, services } = await import(
  "@/db/schema"
);
const {
  listAvailability,
  submitBooking,
  changeBookingStatus,
  rescheduleBooking,
} = await import("@/lib/booking");
const { eq, inArray } = await import("drizzle-orm");

const TEST_PHONE = "+1204555TESTONLY";
const BOOKING_DAY = "2026-08-12";
const RESCHEDULE_DAY = "2026-08-13";
const MOVED_DAY = "2026-08-14";
const CLOSED_DAY = "2026-08-16";
const PAST_DAY = "2026-08-05";
const MISSING_ID = "00000000-0000-4000-8000-000000000000";
const NOW = new Date("2026-08-08T12:00:00Z");

const [service] = await db
  .insert(services)
  .values({ name: "Integration test service", durationHours: 3, price: "100.00" })
  .returning();

afterAll(async () => {
  const testCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.phone, TEST_PHONE));

  const customerIds = testCustomers.map((row) => row.id);

  if (customerIds.length > 0) {
    const testBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(inArray(bookings.customerId, customerIds));

    const bookingIds = testBookings.map((row) => row.id);

    if (bookingIds.length > 0) {
      await db
        .delete(bookingServices)
        .where(inArray(bookingServices.bookingId, bookingIds));
      await db.delete(bookings).where(inArray(bookings.id, bookingIds));
    }

    await db.delete(customers).where(inArray(customers.id, customerIds));
  }

  await db.delete(services).where(eq(services.id, service.id));
});

const customerDetails = {
  name: "Integration Test",
  address: "1 Test Road",
  phone: TEST_PHONE,
  email: "integration@example.com",
  notes: null,
};

describe("booking flow against the real database", () => {
  it("offers slots, books one, then refuses the same window", async () => {
    const before = await listAvailability({
      day: BOOKING_DAY,
      serviceIds: [service.id],
      now: NOW,
    });

    expect(before.length).toBeGreaterThan(0);

    const startHour = 9;

    const booked = await submitBooking(
      {
        day: BOOKING_DAY,
        startHour,
        serviceIds: [service.id],
        customer: customerDetails,
      },
      NOW,
    );

    expect(booked).toMatchObject({ ok: true });

    const clash = await submitBooking(
      {
        day: BOOKING_DAY,
        startHour: 10,
        serviceIds: [service.id],
        customer: customerDetails,
      },
      NOW,
    );

    expect(clash).toEqual({ ok: false, reason: "taken" });

    const after = await listAvailability({
      day: BOOKING_DAY,
      serviceIds: [service.id],
      now: NOW,
    });

    expect(after.length).toBeLessThan(before.length);

    if (booked.ok) {
      expect(await changeBookingStatus(booked.bookingId, "approved")).toEqual({
        ok: true,
      });
      expect(await changeBookingStatus(booked.bookingId, "approved")).toEqual({
        ok: false,
      });
      expect(await changeBookingStatus(booked.bookingId, "completed")).toEqual({
        ok: true,
      });
    }
  });

  it("refuses a slot inside the minimum notice window", async () => {
    const result = await submitBooking(
      {
        day: BOOKING_DAY,
        startHour: 14,
        serviceIds: [service.id],
        customer: customerDetails,
      },
      new Date("2026-08-12T10:00:00Z"),
    );

    expect(result).toEqual({ ok: false, reason: "outside-window" });
  });

  it("refuses the whole booking when one of the chosen services is gone", async () => {
    const result = await submitBooking(
      {
        day: BOOKING_DAY,
        startHour: 13,
        serviceIds: [service.id, MISSING_ID],
        customer: customerDetails,
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, reason: "no-services" });
  });
});

describe("rescheduling a booking against the real database", () => {
  let bookingId = "";

  beforeAll(async () => {
    const moving = await submitBooking(
      {
        day: RESCHEDULE_DAY,
        startHour: 9,
        serviceIds: [service.id],
        customer: customerDetails,
      },
      NOW,
    );

    const blocker = await submitBooking(
      {
        day: MOVED_DAY,
        startHour: 9,
        serviceIds: [service.id],
        customer: customerDetails,
      },
      NOW,
    );

    if (!moving.ok || !blocker.ok) {
      throw new Error("Could not set up the reschedule fixtures.");
    }

    bookingId = moving.bookingId;
  });

  it("moves a booking to a free slot on another open day", async () => {
    const result = await rescheduleBooking({
      bookingId,
      day: MOVED_DAY,
      startHour: 13,
      now: NOW,
    });

    expect(result).toEqual({ ok: true });

    const [moved] = await db
      .select({ startsAt: bookings.startsAt, status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    expect(moved.startsAt.toISOString()).toBe("2026-08-14T18:00:00.000Z");
    expect(moved.status).toBe("pending");
  });

  it("refuses a move onto a day the shop is closed", async () => {
    expect(
      await rescheduleBooking({
        bookingId,
        day: CLOSED_DAY,
        startHour: 10,
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: "closed" });
  });

  it("refuses a move that lands on top of another booking", async () => {
    expect(
      await rescheduleBooking({
        bookingId,
        day: MOVED_DAY,
        startHour: 10,
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: "taken" });
  });

  it("refuses a move for a booking that does not exist", async () => {
    expect(
      await rescheduleBooking({
        bookingId: MISSING_ID,
        day: MOVED_DAY,
        startHour: 13,
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: "unknown" });
  });

  it("refuses a move into a day that has already passed", async () => {
    expect(
      await rescheduleBooking({
        bookingId,
        day: PAST_DAY,
        startHour: 10,
        now: NOW,
      }),
    ).toEqual({ ok: false, reason: "outside-window" });
  });
});
