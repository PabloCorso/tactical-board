import { describe, expect, it } from "vitest";
import { createPlayerObject } from "../objects/player-object";
import type { BoardFrameConfig } from "./types";
import { remapObjectToFrameRotation } from "./frame-object-remap";

const LANDSCAPE_FRAME: BoardFrameConfig = {
  width: 120,
  height: 80,
  orientation: 0,
};

const PORTRAIT_FRAME: BoardFrameConfig = {
  width: 80,
  height: 120,
  orientation: 90,
};

describe("remapObjectToFrameRotation", () => {
  it("moves an object with the frame without changing its rotation", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 30, y: 20 },
      rotation: 35,
    });

    const remapped = remapObjectToFrameRotation({
      object: player,
      previousFrame: LANDSCAPE_FRAME,
      nextFrame: PORTRAIT_FRAME,
    });

    expect(remapped.position).toEqual({ x: 20, y: 90 });
    expect(remapped.rotation).toBe(35);
  });
});
