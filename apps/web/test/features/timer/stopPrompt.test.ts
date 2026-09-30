import { describe, expect, it } from "vitest";
import { shouldAskForStopNote } from "../../../src/features/timer/TimerContext";

describe("shouldAskForStopNote", () => {
  it("skips the note prompt for a todo without evidence", () => {
    expect(shouldAskForStopNote(true, true)).toBe(false);
  });

  it("keeps the configured prompt for a regular todo", () => {
    expect(shouldAskForStopNote(true, false)).toBe(true);
  });

  it("does not prompt when the setting is disabled", () => {
    expect(shouldAskForStopNote(false, false)).toBe(false);
  });
});