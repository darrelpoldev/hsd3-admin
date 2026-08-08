"use client";

import { useActionState } from "react";

import { updateSettings, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = { error: null };

type SettingsFormProps = {
  horizonDays: number;
  minNoticeHours: number;
};

export function SettingsForm({
  horizonDays,
  minNoticeHours,
}: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateSettings,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          defaultValue={horizonDays}
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
          defaultValue={minNoticeHours}
          required
          className="rounded-lg border border-slate-300 px-3 py-3 text-base"
        />
      </label>

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
        Save settings
      </button>
    </form>
  );
}
