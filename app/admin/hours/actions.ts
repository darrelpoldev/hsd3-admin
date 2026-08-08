"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { openingHours } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const wallClockSchema = z.string().regex(/^\d{2}:\d{2}$/);

export async function updateOpeningHours(formData: FormData): Promise<void> {
  await requireAdmin();

  for (const weekday of WEEKDAYS) {
    const opensAt = wallClockSchema.safeParse(formData.get(`opens-${weekday}`));
    const closesAt = wallClockSchema.safeParse(
      formData.get(`closes-${weekday}`),
    );

    if (!opensAt.success || !closesAt.success || closesAt.data <= opensAt.data) {
      continue;
    }

    await db
      .update(openingHours)
      .set({
        opensAt: opensAt.data,
        closesAt: closesAt.data,
        isClosed: formData.get(`closed-${weekday}`) !== null,
      })
      .where(eq(openingHours.weekday, weekday));
  }

  revalidatePath("/admin/hours");
}
