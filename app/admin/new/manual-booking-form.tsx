"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { fetchAvailability } from "@/app/book/actions";

import { createManualBooking, type ManualBookingState } from "../actions";

const initialState: ManualBookingState = { error: null, saved: false };

const slotFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Winnipeg",
  hour: "numeric",
  minute: "2-digit",
});

const hourFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Winnipeg",
  hour: "numeric",
  hour12: false,
});

type Service = {
  id: string;
  name: string;
  durationHours: number;
};

const fieldClassName =
  "rounded-lg border border-line-strong px-3 py-3 text-base w-full";

export function ManualBookingForm({ services }: { services: Service[] }) {
  const [state, formAction, isSubmitting] = useActionState(
    createManualBooking,
    initialState,
  );

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [day, setDay] = useState("");
  const [availability, setAvailability] = useState<{
    key: string;
    slots: string[];
  }>({ key: "", slots: [] });
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isLoadingSlots, startLoadingSlots] = useTransition();

  const availabilityKey =
    day && selectedServiceIds.length > 0
      ? `${day}|${[...selectedServiceIds].sort().join(",")}`
      : "";

  useEffect(() => {
    if (!availabilityKey) {
      return;
    }

    startLoadingSlots(async () => {
      setAvailability({
        key: availabilityKey,
        slots: await fetchAvailability(day, selectedServiceIds),
      });
    });
  }, [availabilityKey, day, selectedServiceIds]);

  const slots = availability.key === availabilityKey ? availability.slots : [];
  const activeSlot = slots.includes(selectedSlot) ? selectedSlot : "";

  if (state.saved) {
    return (
      <p className="rounded-xl border border-success-line bg-success-bg p-4 text-sm text-success-ink">
        Booking added as pending. Approve it from the schedule.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Services</legend>

        {services.map((service) => (
          <label
            key={service.id}
            className="flex items-center gap-3 rounded-lg border border-line px-3 py-3"
          >
            <input
              type="checkbox"
              name="serviceIds"
              value={service.id}
              checked={selectedServiceIds.includes(service.id)}
              onChange={(event) =>
                setSelectedServiceIds((current) =>
                  event.target.checked
                    ? [...current, service.id]
                    : current.filter((id) => id !== service.id),
                )
              }
              className="size-5"
            />
            <span className="flex-1 text-base">{service.name}</span>
            <span className="text-sm text-muted">
              {service.durationHours}h
            </span>
          </label>
        ))}
      </fieldset>

      <input
        type="date"
        name="day"
        value={day}
        onChange={(event) => setDay(event.target.value)}
        required
        className={fieldClassName}
      />

      {isLoadingSlots ? <p className="text-sm text-muted">Checking…</p> : null}

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <label
            key={slot}
            className={`cursor-pointer rounded-lg border px-2 py-3 text-center text-sm ${
              activeSlot === slot
                ? "border-accent bg-accent text-accent-ink"
                : "border-line-strong"
            }`}
          >
            <input
              type="radio"
              name="slot"
              value={slot}
              checked={activeSlot === slot}
              onChange={() => setSelectedSlot(slot)}
              className="sr-only"
            />
            {slotFormatter.format(new Date(slot))}
          </label>
        ))}
      </div>

      <input
        type="hidden"
        name="startHour"
        value={activeSlot ? Number(hourFormatter.format(new Date(activeSlot))) : ""}
      />

      <input name="name" placeholder="Full name" required className={fieldClassName} />
      <input name="address" placeholder="Address" required className={fieldClassName} />
      <input name="phone" type="tel" placeholder="Phone" required className={fieldClassName} />
      <input name="email" type="email" placeholder="Email" required className={fieldClassName} />
      <textarea name="notes" placeholder="Notes (optional)" rows={3} className={fieldClassName} />

      {state.error ? (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !activeSlot}
        className="rounded-lg bg-accent px-4 py-4 text-base font-medium text-accent-ink disabled:opacity-50"
      >
        Add booking
      </button>
    </form>
  );
}
