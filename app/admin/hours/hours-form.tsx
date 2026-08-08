"use client";

import { useActionState } from "react";

import { updateOpeningHours, type OpeningHoursState } from "./actions";

const initialState: OpeningHoursState = { error: null };

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type WeekDay = {
  weekday: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

export function HoursForm({ week }: { week: WeekDay[] }) {
  const [state, formAction, isPending] = useActionState(
    updateOpeningHours,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        Save hours
      </button>
    </form>
  );
}
