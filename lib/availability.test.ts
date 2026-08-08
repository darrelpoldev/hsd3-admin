import { describe, expect, it } from "vitest";

import {
  addHours,
  candidateStartHours,
  openStartTimes,
  overlapsAny,
  parseWallClockToMinutes,
  toShopInstant,
} from "./availability";

const weekdayHours = {
  opensAt: "09:00:00",
  closesAt: "17:00:00",
  isClosed: false,
};

const wideOpenWindow = {
  notBefore: new Date("2000-01-01T00:00:00Z"),
  notAfter: new Date("2100-01-01T00:00:00Z"),
};

describe("parseWallClockToMinutes", () => {
  it("converts a wall-clock time to minutes since midnight", () => {
    expect(parseWallClockToMinutes("09:30:00")).toBe(570);
  });

  it("treats midnight as zero", () => {
    expect(parseWallClockToMinutes("00:00:00")).toBe(0);
  });

  it("throws when the time cannot be parsed", () => {
    expect(() => parseWallClockToMinutes("not-a-time")).toThrow();
  });
});

describe("candidateStartHours", () => {
  it("offers every hour where a one-hour job fits", () => {
    expect(
      candidateStartHours({
        opensAt: "09:00:00",
        closesAt: "17:00:00",
        totalDurationHours: 1,
      }),
    ).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it("stops early enough that a long job still finishes before closing", () => {
    expect(
      candidateStartHours({
        opensAt: "09:00:00",
        closesAt: "15:00:00",
        totalDurationHours: 3,
      }),
    ).toEqual([9, 10, 11, 12]);
  });

  it("rounds the first slot up when opening is mid-hour", () => {
    expect(
      candidateStartHours({
        opensAt: "09:30:00",
        closesAt: "12:00:00",
        totalDurationHours: 1,
      }),
    ).toEqual([10, 11]);
  });

  it("respects a mid-hour closing time", () => {
    expect(
      candidateStartHours({
        opensAt: "09:00:00",
        closesAt: "15:30:00",
        totalDurationHours: 1,
      }),
    ).toEqual([9, 10, 11, 12, 13, 14]);
  });

  it("returns nothing when the job is longer than the day", () => {
    expect(
      candidateStartHours({
        opensAt: "09:00:00",
        closesAt: "15:00:00",
        totalDurationHours: 9,
      }),
    ).toEqual([]);
  });

  it("offers a single slot when the job exactly fills the day", () => {
    expect(
      candidateStartHours({
        opensAt: "09:00:00",
        closesAt: "12:00:00",
        totalDurationHours: 3,
      }),
    ).toEqual([9]);
  });
});

describe("toShopInstant", () => {
  it("converts a summer wall-clock hour using CDT", () => {
    expect(toShopInstant("2026-07-15", 9).toISOString()).toBe(
      "2026-07-15T14:00:00.000Z",
    );
  });

  it("converts a winter wall-clock hour using CST", () => {
    expect(toShopInstant("2026-01-15", 9).toISOString()).toBe(
      "2026-01-15T15:00:00.000Z",
    );
  });
});

describe("overlapsAny", () => {
  const booked = {
    startsAt: new Date("2026-09-01T14:00:00Z"),
    endsAt: new Date("2026-09-01T17:00:00Z"),
  };

  it("finds no overlap against an empty schedule", () => {
    expect(
      overlapsAny(
        {
          startsAt: new Date("2026-09-01T14:00:00Z"),
          endsAt: new Date("2026-09-01T15:00:00Z"),
        },
        [],
      ),
    ).toBe(false);
  });

  it("detects a window starting inside a booked window", () => {
    expect(
      overlapsAny(
        {
          startsAt: new Date("2026-09-01T16:00:00Z"),
          endsAt: new Date("2026-09-01T18:00:00Z"),
        },
        [booked],
      ),
    ).toBe(true);
  });

  it("detects a window that fully contains a booked window", () => {
    expect(
      overlapsAny(
        {
          startsAt: new Date("2026-09-01T13:00:00Z"),
          endsAt: new Date("2026-09-01T18:00:00Z"),
        },
        [booked],
      ),
    ).toBe(true);
  });

  it("allows a window that starts exactly when a booking ends", () => {
    expect(
      overlapsAny(
        {
          startsAt: new Date("2026-09-01T17:00:00Z"),
          endsAt: new Date("2026-09-01T19:00:00Z"),
        },
        [booked],
      ),
    ).toBe(false);
  });

  it("allows a window that ends exactly when a booking starts", () => {
    expect(
      overlapsAny(
        {
          startsAt: new Date("2026-09-01T12:00:00Z"),
          endsAt: new Date("2026-09-01T14:00:00Z"),
        },
        [booked],
      ),
    ).toBe(false);
  });
});

describe("addHours", () => {
  it("advances an instant by whole hours", () => {
    expect(addHours(new Date("2026-09-01T14:00:00Z"), 3).toISOString()).toBe(
      "2026-09-01T17:00:00.000Z",
    );
  });
});

describe("openStartTimes", () => {
  it("returns nothing on a closed day", () => {
    expect(
      openStartTimes({
        day: "2026-07-12",
        openingHours: { ...weekdayHours, isClosed: true },
        totalDurationHours: 1,
        blocking: [],
        ...wideOpenWindow,
      }),
    ).toEqual([]);
  });

  it("returns nothing when no service was selected", () => {
    expect(
      openStartTimes({
        day: "2026-07-15",
        openingHours: weekdayHours,
        totalDurationHours: 0,
        blocking: [],
        ...wideOpenWindow,
      }),
    ).toEqual([]);
  });

  it("offers every open hour when nothing is booked", () => {
    const starts = openStartTimes({
      day: "2026-07-15",
      openingHours: weekdayHours,
      totalDurationHours: 1,
      blocking: [],
      ...wideOpenWindow,
    });

    expect(starts).toHaveLength(8);
    expect(starts[0].toISOString()).toBe("2026-07-15T14:00:00.000Z");
    expect(starts[7].toISOString()).toBe("2026-07-15T21:00:00.000Z");
  });

  it("drops colliding hours but keeps the one that ends exactly as a booking starts", () => {
    const starts = openStartTimes({
      day: "2026-07-15",
      openingHours: weekdayHours,
      totalDurationHours: 3,
      blocking: [
        {
          startsAt: new Date("2026-07-15T17:00:00Z"),
          endsAt: new Date("2026-07-15T18:00:00Z"),
        },
      ],
      ...wideOpenWindow,
    });

    expect(starts.map((start) => start.toISOString())).toEqual([
      "2026-07-15T14:00:00.000Z",
      "2026-07-15T18:00:00.000Z",
      "2026-07-15T19:00:00.000Z",
    ]);
  });

  it("hides slots earlier than the minimum notice", () => {
    const starts = openStartTimes({
      day: "2026-07-15",
      openingHours: weekdayHours,
      totalDurationHours: 1,
      blocking: [],
      notBefore: new Date("2026-07-15T19:00:00Z"),
      notAfter: wideOpenWindow.notAfter,
    });

    expect(starts.map((start) => start.toISOString())).toEqual([
      "2026-07-15T19:00:00.000Z",
      "2026-07-15T20:00:00.000Z",
      "2026-07-15T21:00:00.000Z",
    ]);
  });

  it("hides slots beyond the booking horizon", () => {
    const starts = openStartTimes({
      day: "2026-07-15",
      openingHours: weekdayHours,
      totalDurationHours: 1,
      blocking: [],
      notBefore: wideOpenWindow.notBefore,
      notAfter: new Date("2026-07-15T15:00:00Z"),
    });

    expect(starts.map((start) => start.toISOString())).toEqual([
      "2026-07-15T14:00:00.000Z",
      "2026-07-15T15:00:00.000Z",
    ]);
  });
});
