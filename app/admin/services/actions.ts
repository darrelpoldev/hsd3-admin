"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { services } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

const MAX_DURATION_HOURS = 12;

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  durationHours: z.coerce
    .number()
    .int("Duration must be whole hours.")
    .min(1, "Duration must be at least 1 hour.")
    .max(MAX_DURATION_HOURS, `Duration cannot exceed ${MAX_DURATION_HOURS} hours.`),
  price: z.coerce.number().min(0, "Price cannot be negative."),
});

export type ServiceFormState = { error: string | null };

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    durationHours: formData.get("durationHours"),
    price: formData.get("price"),
  });
}

export async function createService(
  _previous: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireAdmin();

  const parsed = parseServiceForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(services).values({
    name: parsed.data.name,
    durationHours: parsed.data.durationHours,
    price: parsed.data.price.toFixed(2),
  });

  revalidatePath("/admin/services");

  return { error: null };
}

export async function updateService(
  _previous: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireAdmin();

  const serviceId = z.uuid().safeParse(formData.get("serviceId"));
  const parsed = parseServiceForm(formData);

  if (!serviceId.success) {
    return { error: "Unknown service." };
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db
    .update(services)
    .set({
      name: parsed.data.name,
      durationHours: parsed.data.durationHours,
      price: parsed.data.price.toFixed(2),
    })
    .where(eq(services.id, serviceId.data));

  revalidatePath("/admin/services");

  return { error: null };
}

export async function deleteService(formData: FormData): Promise<void> {
  await requireAdmin();

  const serviceId = z.uuid().safeParse(formData.get("serviceId"));

  if (!serviceId.success) {
    return;
  }

  await db.delete(services).where(eq(services.id, serviceId.data));

  revalidatePath("/admin/services");
}
