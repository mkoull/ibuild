import { describe, it, expect } from "vitest";
import { calculateSchedule, daysBetween, addDays } from "./scheduleEngine.js";

describe("scheduleEngine", () => {
  it("calculates finish dates from offset and duration", () => {
    const out = calculateSchedule([
      { id: "a", name: "A", offsetDays: 0, durationDays: 5, dependsOn: [], manuallyPinned: false },
    ], "2026-03-01");
    // Engine treats finish as start + durationDays (inclusive style), so day diff is duration-1.
    expect(daysBetween(out[0].plannedStart, out[0].plannedFinish)).toBe(4);
    expect(out[0].plannedFinish).toBe(addDays(out[0].plannedStart, 5));
  });

  it("preserves pinned dates when manually pinned", () => {
    const out = calculateSchedule([
      {
        id: "a",
        name: "Pinned",
        offsetDays: 0,
        durationDays: 7,
        dependsOn: [],
        manuallyPinned: true,
        pinnedStart: "2026-04-10",
        pinnedFinish: "2026-04-17",
      },
    ], "2026-03-01");
    expect(out[0].plannedStart).toBe("2026-04-10");
    expect(out[0].plannedFinish).toBe("2026-04-17");
    expect(out[0].offsetDays).toBe(daysBetween("2026-03-01", "2026-04-10"));
  });

  it("keeps dependency start at or after dependency finish", () => {
    const out = calculateSchedule([
      { id: "a", name: "A", offsetDays: 0, durationDays: 7, dependsOn: [], manuallyPinned: false },
      { id: "b", name: "B", offsetDays: 2, durationDays: 3, dependsOn: ["a"], manuallyPinned: false },
    ], "2026-03-01");
    const depFinish = out.find(x => x.id === "a").plannedFinish;
    const bStart = out.find(x => x.id === "b").plannedStart;
    expect(bStart >= depFinish).toBe(true);
  });
});

