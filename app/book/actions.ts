"use server";

import { z } from "zod";

import { listAvailability, submitBooking } from "@/lib/booking";

const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

const availabilitySchema = z.object({
  day: daySchema,
  serviceIds: z.array(z.uuid()).min(1),
});

const bookingSchema = z.object({
  day: daySchema,
  startHour: z.coerce.number().int().min(0).max(23),
  serviceIds: z.array(z.uuid()).min(1, "Choose at least one service."),
  name: z.string().trim().min(1, "Your name is required."),
  address: z.string().trim().min(1, "Your address is required."),
  phone: z.string().trim().min(1, "A phone number is required."),
  email: z.email("Enter a valid email address."),
  notes: z.string().trim().max(1000).optional(),
});

const REASON_MESSAGES = {
  "no-services": "Choose at least one service.",
  closed: "The shop is closed that day.",
  "outside-window": "That time is no longer bookable. Pick another slot.",
  taken: "Someone just took that slot. Pick another one.",
} as const;

export type BookingState =
  | { status: "idle"; error: null }
  | { status: "error"; error: string }
  | { status: "booked"; error: null };

export async function fetchAvailability(
  day: string,
  serviceIds: string[],
): Promise<string[]> {
  const parsed = availabilitySchema.safeParse({ day, serviceIds });

  if (!parsed.success) {
    return [];
  }

  const slots = await listAvailability({
    day: parsed.data.day,
    serviceIds: parsed.data.serviceIds,
    now: new Date(),
  });

  return slots.map((slot) => slot.toISOString());
}

export async function createBooking(
  _previous: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse({
    day: formData.get("day"),
    startHour: formData.get("startHour"),
    serviceIds: formData.getAll("serviceIds"),
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0].message };
  }

  const result = await submitBooking(
    {
      day: parsed.data.day,
      startHour: parsed.data.startHour,
      serviceIds: parsed.data.serviceIds,
      customer: {
        name: parsed.data.name,
        address: parsed.data.address,
        phone: parsed.data.phone,
        email: parsed.data.email,
        notes: parsed.data.notes ?? null,
      },
    },
    new Date(),
  );

  if (!result.ok) {
    return { status: "error", error: REASON_MESSAGES[result.reason] };
  }

  return { status: "booked", error: null };
}
