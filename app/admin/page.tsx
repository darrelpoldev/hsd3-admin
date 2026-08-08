import Link from "next/link";

import { toShopInstant } from "@/lib/availability";
import { listBookingsForDay, type DayBooking } from "@/lib/booking";
import {
  formatDuration,
  formatPrice,
  formatShopDate,
  formatShopDay,
  formatShopTime,
} from "@/lib/format";
import { requireSession } from "@/lib/session";

import { StatusActionForm } from "./status-action-form";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-warn-bg text-warn-ink",
  approved: "bg-success-bg text-success-ink",
  rejected: "bg-neutral-bg text-neutral-ink",
  cancelled: "bg-neutral-bg text-neutral-ink",
  completed: "bg-info-bg text-info-ink",
  no_show: "bg-danger-bg text-danger-ink",
};

const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  pending: [
    { status: "approved", label: "Approve" },
    { status: "rejected", label: "Reject" },
  ],
  approved: [
    { status: "completed", label: "Completed" },
    { status: "no_show", label: "No show" },
    { status: "cancelled", label: "Cancel" },
  ],
};

function BookingCard({ booking }: { booking: DayBooking }) {
  const actions = NEXT_ACTIONS[booking.status] ?? [];

  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-medium">
          {formatShopTime(booking.startsAt)} – {formatShopTime(booking.endsAt)}
        </h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_CLASSES[booking.status]}`}
        >
          {STATUS_LABELS[booking.status]}
        </span>
      </header>

      <p className="mt-2 text-base">{booking.customerName}</p>
      <p className="text-sm text-muted">
        <a href={`tel:${booking.customerPhone}`} className="underline">
          {booking.customerPhone}
        </a>
      </p>
      <p className="text-sm text-muted">{booking.customerAddress}</p>

      <ul className="mt-2 text-sm text-ink">
        {booking.services.map((service) => (
          <li key={service.id}>
            {service.name} · {formatDuration(service.durationHours)} ·{" "}
            {formatPrice(service.price)}
          </li>
        ))}
      </ul>

      {booking.notes ? (
        <p className="mt-2 rounded-lg bg-raised px-3 py-2 text-sm text-ink">
          {booking.notes}
        </p>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <StatusActionForm
              key={action.status}
              bookingId={booking.id}
              status={action.status}
              label={action.label}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  await requireSession();

  const params = await searchParams;
  const day = params.day ?? formatShopDay(new Date());
  const dayBookings = await listBookingsForDay(day);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">
          {formatShopDate(toShopInstant(day, 12))}
        </h1>

        <form className="flex gap-2">
          <input
            type="date"
            name="day"
            defaultValue={day}
            className="min-w-0 flex-1 rounded-lg border border-line-strong px-3 py-3 text-base"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-ink"
          >
            Go
          </button>
        </form>

        <Link href="/admin/new" className="text-sm text-ink underline">
          Add a walk-in or phone booking
        </Link>
      </header>

      {dayBookings.length === 0 ? (
        <p className="text-sm text-muted">Nothing booked for this day.</p>
      ) : (
        <section className="flex flex-col gap-3">
          {dayBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </section>
      )}
    </div>
  );
}
