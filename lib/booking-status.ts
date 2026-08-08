export const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["completed", "no_show", "cancelled"],
  rejected: [],
  cancelled: [],
  completed: [],
  no_show: [],
};

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isBlockingStatus(status: BookingStatus): boolean {
  return status === "pending" || status === "approved" || status === "completed";
}
