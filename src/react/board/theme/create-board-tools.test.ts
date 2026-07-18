import { describe, expect, it, vi } from "vitest";
import { createBoardEditorStore } from "../../../core/store/board-editor-store";
import {
  createPlayerObject,
  PLAYER_OBJECT_TYPE,
} from "../../../core/objects/player-object";
import type { Shape } from "../../../core/board/types";
import { createEquipmentObjectAdapter } from "./equipment-object-adapter";
import { createBoardTools } from "./create-board-tools";

function createObject(id: string, type: string): Shape {
  return { id, type, position: { x: 0, y: 0 }, props: {} };
}

describe("createBoardTools", () => {
  it("uses semantic defaults only when inserting new Objects", () => {
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        frame: { width: 100, height: 50 },
        objects: { byId: {}, order: [] },
        style: {},
      },
      tools: createBoardTools({
        theme: {
          id: "test-theme",
          name: "Test theme",
          objects: [
            {
              type: "equipment",
              kind: "cone",
              label: "Cone",
              defaultSize: { width: 1, height: 1 },
            },
          ],
        },
        adapters: {
          objectAdapters: [createEquipmentObjectAdapter()],
        },
      }),
    });

    store
      .getState()
      .actions.addObjects([
        createObject("player", "player"),
        createObject("text", "text"),
        createObject("equipment", "equipment"),
        createObject("shape", "shape"),
        createObject("arrow", "arrow"),
      ]);

    expect(store.getState().board.objects.order).toEqual([
      "shape",
      "equipment",
      "arrow",
      "player",
      "text",
    ]);

    store.getState().actions.bringObjectsToFront(["shape"]);
    store.getState().actions.addObjects([createObject("arrow-2", "arrow")]);

    expect(store.getState().board.objects.order).toEqual([
      "equipment",
      "arrow",
      "arrow-2",
      "player",
      "text",
      "shape",
    ]);
  });

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
            fontSize: 12,
          }),
          size: { width: 24, height: 24 },
        }),
      }),
    );
  });
});
