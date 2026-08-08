"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  changeBookingStatus,
  rescheduleBooking,
  submitBooking,
} from "@/lib/booking";
import { BOOKING_STATUSES } from "@/lib/booking-status";
import { requireSession } from "@/lib/session";

const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const statusChangeSchema = z.object({
  bookingId: z.uuid(),
  status: z.enum(BOOKING_STATUSES),
});

const rescheduleSchema = z.object({
  bookingId: z.uuid(),
  day: daySchema,
  startHour: z.coerce.number().int().min(0).max(23),
});

const manualBookingSchema = z.object({
  day: daySchema,
  startHour: z.coerce.number().int().min(0).max(23),
  serviceIds: z.array(z.uuid()).min(1, "Choose at least one service."),
  name: z.string().trim().min(1, "Name is required."),
  address: z.string().trim().min(1, "Address is required."),
  phone: z.string().trim().min(1, "Phone number is required."),
  email: z.email("Enter a valid email address."),
  notes: z.string().trim().max(1000).optional(),
});

export type ManualBookingState = { error: string | null; saved: boolean };

export async function setBookingStatus(formData: FormData): Promise<void> {
  await requireSession();

  const parsed = statusChangeSchema.safeParse({
    bookingId: formData.get("bookingId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return;
  }

  await changeBookingStatus(parsed.data.bookingId, parsed.data.status);

  revalidatePath("/admin");
}

export async function moveBooking(formData: FormData): Promise<void> {
  await requireSession();

  const parsed = rescheduleSchema.safeParse({
    bookingId: formData.get("bookingId"),
    day: formData.get("day"),
    startHour: formData.get("startHour"),
  });

  if (!parsed.success) {
    return;
  }

  await rescheduleBooking(parsed.data);

  revalidatePath("/admin");
}

export async function createManualBooking(
  _previous: ManualBookingState,
  formData: FormData,
): Promise<ManualBookingState> {
  await requireSession();

  const parsed = manualBookingSchema.safeParse({
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
    return { error: parsed.error.issues[0].message, saved: false };
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
    return { error: `Could not book: ${result.reason}.`, saved: false };
  }

  revalidatePath("/admin");

  return { error: null, saved: true };
}
