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
  horizonDays: z.coerce.number().int().min(1).max(MAX_HORIZON_DAYS),
  minNoticeHours: z.coerce.number().int().min(0).max(MAX_NOTICE_HOURS),
});

export async function updateSettings(formData: FormData): Promise<void> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    horizonDays: formData.get("horizonDays"),
    minNoticeHours: formData.get("minNoticeHours"),
  });

  if (!parsed.success) {
    return;
  }

  await db.update(settings).set(parsed.data).where(eq(settings.id, 1));

  revalidatePath("/admin/settings");
}
