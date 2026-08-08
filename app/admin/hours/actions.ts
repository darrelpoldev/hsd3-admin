"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { openingHours } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const wallClockSchema = z.string().regex(/^\d{2}:\d{2}$/);

export type OpeningHoursState = { error: string | null };

export async function updateOpeningHours(
  _previous: OpeningHoursState,
  formData: FormData,
): Promise<OpeningHoursState> {
  await requireAdmin();

  const week: {
    weekday: number;
    opensAt: string;
    closesAt: string;
    isClosed: boolean;
  }[] = [];

  for (const weekday of WEEKDAYS) {
    const opensAt = wallClockSchema.safeParse(formData.get(`opens-${weekday}`));
    const closesAt = wallClockSchema.safeParse(
      formData.get(`closes-${weekday}`),
    );

    if (!opensAt.success || !closesAt.success || closesAt.data <= opensAt.data) {
      return {
        error: `${WEEKDAY_NAMES[weekday]} needs a closing time later than its opening time.`,
      };
    }

    week.push({
      weekday,
      opensAt: opensAt.data,
      closesAt: closesAt.data,
      isClosed: formData.get(`closed-${weekday}`) !== null,
    });
  }

  for (const day of week) {
    await db
      .update(openingHours)
      .set({
        opensAt: day.opensAt,
        closesAt: day.closesAt,
        isClosed: day.isClosed,
      })
      .where(eq(openingHours.weekday, day.weekday));
  }

  revalidatePath("/admin/hours");

  return { error: null };
}
