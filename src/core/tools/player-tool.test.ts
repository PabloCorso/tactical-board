import { describe, expect, it, vi } from "vitest";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import { createPlayerObject } from "../objects/player-object";
import { createPlayerRenderer } from "./player-tool";

describe("createPlayerRenderer", () => {
  it("dispatches marker rendering by player appearance id", () => {
    const appearanceRenderer = vi.fn();
    const renderer = createPlayerRenderer({
      shirt: appearanceRenderer,
    });
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      color: "#1f6feb",
      appearanceId: "shirt",
    });
    const frameTransform = createBoardSpaceProjection({
      frame: {
        width: 100,
        height: 50,
      },
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
      canvasRect: {
        width: 1000,
        height: 500,
      },
    });

    renderer({
      context: {} as CanvasRenderingContext2D,
      board: {
        id: "board-1",
        version: 1,
        metadata: {},
        frame: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {
            [player.id]: player,
          },
          order: [player.id],
        },
        style: {},
      },
      object: player,
      appearance: "default",
      requestRender: () => {},
      frameTransform,
    });

    expect(appearanceRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        player: expect.objectContaining({
          props: expect.objectContaining({
            appearanceId: "shirt",
            color: "#1f6feb",
            fontSize: 12,
          }),
          size: { width: 24, height: 24 },
        }),
      }),
    );
  });
});
