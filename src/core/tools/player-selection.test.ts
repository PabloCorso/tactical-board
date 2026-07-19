import { describe, expect, it } from "vitest";
import { createPlayerObject } from "../objects/player-object";
import { getPlayerSelectionOutlineCanvasPoints } from "./player-selection";

const projection = {
  scale: 1,
  boardToCanvas: (point: { x: number; y: number }) => point,
  canvasToBoard: (point: { x: number; y: number }) => point,
  getObjectCanvasBounds: (player: {
    position: { x: number; y: number };
    size?: { width: number; height: number };
  }) => ({
    x: player.position.x - (player.size?.width ?? 0) / 2,
    y: player.position.y - (player.size?.height ?? 0) / 2,
    width: player.size?.width ?? 0,
    height: player.size?.height ?? 0,
  }),
};

describe("player selection geometry", () => {
  it("keeps transform controls stable when a caption is toggled", () => {
    const player = createPlayerObject({
      id: "player",
      position: { x: 50, y: 50 },
      rotation: 30,
      size: { width: 20, height: 20 },
    });
    const captionedPlayer = createPlayerObject({
      ...player,
      caption: {
        text: "A very long caption",
        style: { placement: "right", backgroundStyle: "solid" },
      },
    });

    expect(
      getPlayerSelectionOutlineCanvasPoints(projection, captionedPlayer),
    ).toEqual(getPlayerSelectionOutlineCanvasPoints(projection, player));
  });
});
