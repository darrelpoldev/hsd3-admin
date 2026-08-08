"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

const MAX_HORIZON_DAYS = 365;
const MAX_NOTICE_HOURS = 720;

const settingsSchema = z.object({
  horizonDays: z.coerce
    .number()
    .int("How far ahead customers can book must be whole days.")
    .min(1, "Customers must be able to book at least 1 day ahead.")
    .max(MAX_HORIZON_DAYS, `Booking ahead cannot exceed ${MAX_HORIZON_DAYS} days.`),
  minNoticeHours: z.coerce
    .number()
    .int("Minimum notice must be whole hours.")
    .min(0, "Minimum notice cannot be negative.")
    .max(MAX_NOTICE_HOURS, `Minimum notice cannot exceed ${MAX_NOTICE_HOURS} hours.`),
});

export type SettingsFormState = { error: string | null };

export async function updateSettings(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    horizonDays: formData.get("horizonDays"),
    minNoticeHours: formData.get("minNoticeHours"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.update(settings).set(parsed.data).where(eq(settings.id, 1));

  revalidatePath("/admin/settings");

  return { error: null };
}
