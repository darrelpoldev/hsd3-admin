"use client";

import { useActionState } from "react";

import { setBookingStatus, type StatusChangeState } from "./actions";

const initialState: StatusChangeState = { error: null };

export function StatusActionForm({
  bookingId,
  status,
  label,
}: {
  bookingId: string;
  status: string;
  label: string;
}) {
  const [state, formAction, isPending] = useActionState(
    setBookingStatus,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="status" value={status} />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-line-strong px-3 py-2 text-sm disabled:opacity-60"
      >
        {label}
      </button>

      {state.error ? (
        <p className="mt-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-ink">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
