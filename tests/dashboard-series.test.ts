import { describe, expect, it } from "vitest";
import { bucketByDay, niceMax, recentDays, seriesStart, seriesTotal, storeDay } from "@/lib/dashboard-series";

describe("dashboard day series", () => {
  // 20 Oct 2026, 20:30 UTC is already 21 Oct in Colombo (UTC+5:30).
  const now = new Date("2026-10-20T20:30:00Z");

  it("counts days in Sri Lanka time", () => {
    expect(storeDay(now)).toBe("2026-10-21");
    expect(storeDay("not a date")).toBeNull();
  });

  it("lists the last 30 days oldest first, ending today", () => {
    const days = recentDays(30, now);
    expect(days).toHaveLength(30);
    expect(days[0]).toBe("2026-09-22");
    expect(days.at(-1)).toBe("2026-10-21");
    expect(new Set(days).size).toBe(30);
    expect(Date.parse(seriesStart(30, now))).toBeLessThan(Date.parse("2026-09-21T18:30:00Z"));
  });

  it("sums rows into their day and drops rows outside the window", () => {
    const days = recentDays(3, now);
    const rows = [
      { at: "2026-10-20T19:00:00Z", total: 500 }, // 21 Oct in Colombo
      { at: "2026-10-19T10:00:00Z", total: 200 },
      { at: "2026-10-19T11:00:00Z", total: 300 },
      { at: "2026-09-01T10:00:00Z", total: 999 },
    ];
    const points = bucketByDay(rows, (row) => row.at, days, (row) => row.total);
    expect(points).toEqual([
      { day: "2026-10-19", value: 500 },
      { day: "2026-10-20", value: 0 },
      { day: "2026-10-21", value: 500 },
    ]);
    expect(seriesTotal(points)).toBe(1000);
    expect(bucketByDay(rows, (row) => row.at, days).map((point) => point.value)).toEqual([2, 0, 1]);
  });

  it("rounds the axis to readable steps", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(12)).toBe(20);
    expect(niceMax(4300)).toBe(5000);
  });
});
