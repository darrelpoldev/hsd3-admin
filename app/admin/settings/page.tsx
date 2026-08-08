import { eq } from "drizzle-orm";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

import { updateSettings } from "./actions";

export default async function SettingsPage() {
  await requireAdmin();

  const [current] = await db.select().from(settings).where(eq(settings.id, 1));

  return (
    <form action={updateSettings} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Booking settings</h1>
        <p className="text-sm text-slate-600">
          These decide which slots the public form is allowed to offer.
        </p>
      </header>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">How far ahead customers can book (days)</span>
        <input
          name="horizonDays"
          type="number"
          min={1}
          max={365}
          defaultValue={current?.horizonDays ?? 30}
          required
          className="rounded-lg border border-slate-300 px-3 py-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Minimum notice before a slot (hours)</span>
        <input
          name="minNoticeHours"
          type="number"
          min={0}
          max={720}
          defaultValue={current?.minNoticeHours ?? 24}
          required
          className="rounded-lg border border-slate-300 px-3 py-3 text-base"
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-3 text-base font-medium text-white"
      >
        Save settings
      </button>
    </form>
  );
}
