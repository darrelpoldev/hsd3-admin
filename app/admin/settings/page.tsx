import { eq } from "drizzle-orm";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requireAdmin();

  const [current] = await db.select().from(settings).where(eq(settings.id, 1));

  return (
    <SettingsForm
      horizonDays={current?.horizonDays ?? 30}
      minNoticeHours={current?.minNoticeHours ?? 24}
    />
  );
}
