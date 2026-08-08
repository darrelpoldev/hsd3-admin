"use client";

import { useActionState } from "react";

import {
  createService,
  updateService,
  type ServiceFormState,
} from "./actions";

const initialState: ServiceFormState = { error: null };

type ServiceFormProps = {
  service?: {
    id: string;
    name: string;
    durationHours: number;
    price: string;
  };
};

export function ServiceForm({ service }: ServiceFormProps) {
  const [state, formAction, isPending] = useActionState(
    service ? updateService : createService,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {service ? (
        <input type="hidden" name="serviceId" value={service.id} />
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Service name</span>
        <input
          name="name"
          defaultValue={service?.name}
          required
          className="rounded-lg border border-slate-300 px-3 py-3 text-base"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">Hours</span>
          <input
            name="durationHours"
            type="number"
            min={1}
            max={12}
            step={1}
            defaultValue={service?.durationHours ?? 1}
            required
            className="rounded-lg border border-slate-300 px-3 py-3 text-base"
          />
        </label>

        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">Price</span>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={service?.price ?? ""}
            required
            className="rounded-lg border border-slate-300 px-3 py-3 text-base"
          />
        </label>
      </div>

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
        {service ? "Save changes" : "Add service"}
      </button>
    </form>
  );
}
