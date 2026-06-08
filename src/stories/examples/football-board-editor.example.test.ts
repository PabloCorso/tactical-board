import { describe, expect, it } from "vitest";
import { createFootballPitch } from "../../react";
import { createFootballPitchFrameOptions } from "./football-board-editor.example";

describe("createFootballPitchFrameOptions", () => {
  it("preserves the current pitch orientation when reselecting the active pitch variant", () => {
    const [fullPitchOption] = createFootballPitchFrameOptions();
    const rotatedFrame = createFootballPitch({
      orientation: 90,
      variant: "full-pitch",
    });

    const nextFrame = fullPitchOption?.createFrame({
      active: true,
      frame: rotatedFrame,
      value: "full-pitch",
    });

    expect(nextFrame?.orientation).toBe(90);
  });

  it("does not apply the current pitch orientation when selecting another variant", () => {
    const [, halfPitchOption] = createFootballPitchFrameOptions();
    const rotatedFrame = createFootballPitch({
      orientation: 90,
      variant: "full-pitch",
    });

    const nextFrame = halfPitchOption?.createFrame({
      active: false,
      frame: rotatedFrame,
      value: "half-pitch",
    });

    expect(nextFrame?.orientation).toBeUndefined();
  });
});
