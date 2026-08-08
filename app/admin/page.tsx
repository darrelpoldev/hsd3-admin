import Link from "next/link";

import { listBookingsForDay, type DayBooking } from "@/lib/booking";
import {
  formatDuration,
  formatPrice,
  formatShopDate,
  formatShopDay,
  formatShopTime,
} from "@/lib/format";
import { requireSession } from "@/lib/session";

import { setBookingStatus } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-slate-200 text-slate-700",
  cancelled: "bg-slate-200 text-slate-700",
  completed: "bg-blue-100 text-blue-900",
  no_show: "bg-red-100 text-red-900",
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
    <article className="rounded-xl border border-slate-200 bg-white p-4">
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
      <p className="text-sm text-slate-600">
        <a href={`tel:${booking.customerPhone}`} className="underline">
          {booking.customerPhone}
        </a>
      </p>
      <p className="text-sm text-slate-600">{booking.customerAddress}</p>

      <ul className="mt-2 text-sm text-slate-700">
        {booking.services.map((service) => (
          <li key={service.id}>
            {service.name} · {formatDuration(service.durationHours)} ·{" "}
            {formatPrice(service.price)}
          </li>
        ))}
      </ul>

      {booking.notes ? (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {booking.notes}
        </p>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <form key={action.status} action={setBookingStatus}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="status" value={action.status} />
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {action.label}
              </button>
            </form>
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
        <h1 className="text-xl font-semibold">{formatShopDate(new Date(`${day}T12:00:00Z`))}</h1>

        <form className="flex gap-2">
          <input
            type="date"
            name="day"
            defaultValue={day}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-3 text-base"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white"
          >
            Go
          </button>
        </form>

        <Link href="/admin/new" className="text-sm text-slate-700 underline">
          Add a walk-in or phone booking
        </Link>
      </header>

      {dayBookings.length === 0 ? (
        <p className="text-sm text-slate-600">Nothing booked for this day.</p>
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
