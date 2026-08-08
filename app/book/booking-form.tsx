"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { createBooking, fetchAvailability, type BookingState } from "./actions";

const initialState: BookingState = { status: "idle", error: null };

const slotFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Winnipeg",
  hour: "numeric",
  minute: "2-digit",
});

type Service = {
  id: string;
  name: string;
  durationHours: number;
  price: string;
};

const fieldClassName =
  "rounded-lg border border-slate-300 px-3 py-3 text-base w-full";

export function BookingForm({ services }: { services: Service[] }) {
  const [state, formAction, isSubmitting] = useActionState(
    createBooking,
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

  if (state.status === "booked") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <h2 className="text-base font-medium text-green-900">Request sent</h2>
        <p className="mt-1 text-sm text-green-800">
          The shop will call you to confirm your appointment.
        </p>
      </div>
    );
  }

  const totalHours = services
    .filter((service) => selectedServiceIds.includes(service.id))
    .reduce((total, service) => total + service.durationHours, 0);

  const startHour = activeSlot
    ? Number(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Winnipeg",
          hour: "numeric",
          hour12: false,
        }).format(new Date(activeSlot)),
      )
    : "";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">1. Services</legend>

        {services.map((service) => (
          <label
            key={service.id}
            className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3"
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
            <span className="text-sm text-slate-600">
              {service.durationHours}h · ${service.price}
            </span>
          </label>
        ))}

        {totalHours > 0 ? (
          <p className="text-sm text-slate-600">
            Total time in the shop: {totalHours}h
          </p>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">2. Date</legend>
        <input
          type="date"
          name="day"
          value={day}
          onChange={(event) => setDay(event.target.value)}
          required
          className={fieldClassName}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">3. Time</legend>

        {isLoadingSlots ? <p className="text-sm text-slate-600">Checking…</p> : null}

        {!isLoadingSlots && day && selectedServiceIds.length > 0 && slots.length === 0 ? (
          <p className="text-sm text-slate-600">
            Nothing open that day. Try another date.
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <label
              key={slot}
              className={`cursor-pointer rounded-lg border px-2 py-3 text-center text-sm ${
                activeSlot === slot
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300"
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

        <input type="hidden" name="startHour" value={startHour} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-medium">4. Your details</legend>

        <input name="name" placeholder="Full name" required className={fieldClassName} />
        <input name="address" placeholder="Address" required className={fieldClassName} />
        <input
          name="phone"
          type="tel"
          placeholder="Phone number"
          required
          className={fieldClassName}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className={fieldClassName}
        />
        <textarea
          name="notes"
          placeholder="Anything we should know (optional)"
          rows={3}
          className={fieldClassName}
        />
      </fieldset>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !activeSlot}
        className="rounded-lg bg-slate-900 px-4 py-4 text-base font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Request this appointment"}
      </button>
    </form>
  );
}
