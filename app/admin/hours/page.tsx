import { asc } from "drizzle-orm";

import { db } from "@/db";
import { openingHours } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

import { HoursForm } from "./hours-form";

export default async function HoursPage() {
  await requireAdmin();

  const week = await db
    .select()
    .from(openingHours)
    .orderBy(asc(openingHours.weekday));

  return <HoursForm week={week} />;
}
