import { config } from "dotenv";
import { afterAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });

const { db } = await import("@/db");
const { bookingServices, bookings, customers, services } = await import(
  "@/db/schema"
);
const { listAvailability, submitBooking, changeBookingStatus } = await import(
  "@/lib/booking"
);
const { eq, inArray } = await import("drizzle-orm");

const TEST_PHONE = "+1204555TESTONLY";
const BOOKING_DAY = "2026-08-12";
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
});
