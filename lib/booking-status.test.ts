import { describe, expect, it } from "vitest";

import {
  BOOKING_STATUSES,
  canTransition,
  isBlockingStatus,
} from "./booking-status";

describe("canTransition", () => {
  it("lets staff approve a pending booking", () => {
    expect(canTransition("pending", "approved")).toBe(true);
  });

  it("lets staff reject a pending booking", () => {
    expect(canTransition("pending", "rejected")).toBe(true);
  });

  it("lets staff close out an approved booking as completed", () => {
    expect(canTransition("approved", "completed")).toBe(true);
  });

  it("lets staff mark an approved booking as a no-show", () => {
    expect(canTransition("approved", "no_show")).toBe(true);
  });

  it("refuses to complete a booking that was never approved", () => {
    expect(canTransition("pending", "completed")).toBe(false);
  });

  it("refuses to revive a rejected booking", () => {
    expect(canTransition("rejected", "approved")).toBe(false);
  });

  it("refuses to change a booking that is already completed", () => {
    expect(canTransition("completed", "cancelled")).toBe(false);
  });

  it("treats every terminal status as final", () => {
    const terminal = ["rejected", "cancelled", "completed", "no_show"] as const;

    for (const from of terminal) {
      for (const to of BOOKING_STATUSES) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });
});

describe("isBlockingStatus", () => {
  it("blocks the window for pending, approved and completed", () => {
    expect(isBlockingStatus("pending")).toBe(true);
    expect(isBlockingStatus("approved")).toBe(true);
    expect(isBlockingStatus("completed")).toBe(true);
  });

  it("frees the window for rejected, cancelled and no-show", () => {
    expect(isBlockingStatus("rejected")).toBe(false);
    expect(isBlockingStatus("cancelled")).toBe(false);
    expect(isBlockingStatus("no_show")).toBe(false);
  });
});
