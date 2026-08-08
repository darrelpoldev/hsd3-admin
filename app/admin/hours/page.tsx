import { asc } from "drizzle-orm";

import { db } from "@/db";
import { openingHours } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

import { updateOpeningHours } from "./actions";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function HoursPage() {
  await requireAdmin();

  const week = await db
    .select()
    .from(openingHours)
    .orderBy(asc(openingHours.weekday));

  return (
    <form action={updateOpeningHours} className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Opening hours</h1>
        <p className="text-sm text-slate-600">
          Start times are offered on the hour, and only where the whole job fits
          before closing.
        </p>
      </header>

      {week.map((day) => (
        <fieldset
          key={day.weekday}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <legend className="px-1 text-base font-medium">
            {WEEKDAY_NAMES[day.weekday]}
          </legend>

          <label className="mb-3 flex items-center gap-3">
            <input
              type="checkbox"
              name={`closed-${day.weekday}`}
              defaultChecked={day.isClosed}
              className="size-5"
            />
            <span className="text-sm">Closed all day</span>
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium">Opens</span>
              <input
                type="time"
                name={`opens-${day.weekday}`}
                defaultValue={day.opensAt.slice(0, 5)}
                className="rounded-lg border border-slate-300 px-3 py-3 text-base"
              />
            </label>

            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium">Closes</span>
              <input
                type="time"
                name={`closes-${day.weekday}`}
                defaultValue={day.closesAt.slice(0, 5)}
                className="rounded-lg border border-slate-300 px-3 py-3 text-base"
              />
            </label>
          </div>
        </fieldset>
      ))}

      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-3 text-base font-medium text-white"
      >
        Save hours
      </button>
    </form>
  );
}
