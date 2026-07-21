import { describe, expect, it } from "vitest";
import type { Board } from "../../../../core/board/types";
import { createPlayerObject } from "../../../../core/objects/player-object";
import type { PlayerAppearanceRendererInput } from "../../../../core/tools/player-appearance";
import { renderFootballCirclePlayerAppearance } from "./football-player-appearances";

describe("football player appearances", () => {
  it("fits the complete circle stroke inside the configured player size", () => {
    let radius = 0;
    let lineWidth = 1;
    let paintedOuterRadius = 0;
    const context = {
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      beginPath() {},
      arc(_x: number, _y: number, nextRadius: number) {
        radius = nextRadius;
      },
      fill() {},
      stroke() {
        paintedOuterRadius = radius + lineWidth / 2;
      },
      get lineWidth() {
        return lineWidth;
      },
      set lineWidth(value: number) {
        lineWidth = value;
      },
      globalAlpha: 1,
      fillStyle: "",
      strokeStyle: "",
    } as unknown as CanvasRenderingContext2D;
    const player = createPlayerObject({
      id: "player",
      position: { x: 0, y: 0 },
      size: { width: 22, height: 22 },
    });

    renderFootballCirclePlayerAppearance({
      appearance: "default",
      board: {} as Board,
      context,
      frameTransform: {
        scale: 1,
        getObjectCanvasBounds: () => ({
          x: -11,
          y: -11,
          width: 22,
          height: 22,
        }),
      } as unknown as PlayerAppearanceRendererInput["frameTransform"],
      object: player,
      player,
      requestRender() {},
    });

    expect(paintedOuterRadius).toBeLessThanOrEqual(11);
  });
});
