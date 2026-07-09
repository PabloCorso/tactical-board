import { describe, expect, it, vi } from "vitest";
import { createBoardEditorStore } from "../../../core/store/board-editor-store";
import {
  createPlayerObject,
  PLAYER_OBJECT_TYPE,
} from "../../../core/objects/player-object";
import { createBoardTools } from "./create-board-tools";

describe("createBoardTools", () => {
  it("registers player appearance renderers on the player tool", () => {
    const appearanceRenderer = vi.fn();
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        frame: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {},
          order: [],
        },
        style: {},
      },
      tools: createBoardTools({
        adapters: {
          playerAppearanceRenderers: {
            "football-shirt": appearanceRenderer,
          },
        },
      }),
    });
    const renderer =
      store.getState().rendering.objectRenderers[PLAYER_OBJECT_TYPE];
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      appearanceId: "football-shirt",
    });

    renderer?.({
      context: {} as CanvasRenderingContext2D,
      board: store.getState().board,
      object: player,
      appearance: "default",
      requestRender: () => {},
      frameTransform: {
        scale: 1,
      } as never,
    });

    expect(appearanceRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        player: expect.objectContaining({
          props: expect.objectContaining({
            appearanceId: "football-shirt",
            color: "#1f1f1f",
            fontSize: 9.5,
          }),
          size: { width: 22, height: 22 },
        }),
      }),
    );
  });
});
