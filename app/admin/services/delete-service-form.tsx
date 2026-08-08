"use client";

import { useActionState } from "react";

import { deleteService, type ServiceFormState } from "./actions";

const initialState: ServiceFormState = { error: null };

export function DeleteServiceForm({ serviceId }: { serviceId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteService,
    initialState,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="serviceId" value={serviceId} />

      {state.error ? (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start text-sm text-danger-ink underline disabled:opacity-60"
      >
        Delete service
      </button>
    </form>
  );
}
