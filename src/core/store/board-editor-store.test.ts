import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "./board-editor-store";
import {
  getSelectToolState,
  SELECT_TOOL_ID,
} from "../../tools/select-tool-state";

describe("createBoardEditorStore", () => {
  const createStore = () =>
    createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {},
          order: [],
        },
        style: {},
      },
      tools: [
        {
          id: SELECT_TOOL_ID,
          label: "Select",
        },
        {
          id: "draw",
          label: "Draw",
        },
      ],
    });

  it("stores selected object ids under select tool state", () => {
    const store = createStore();

    store.getState().actions.setSelectedObjectIds(["a", "b"]);

    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual(["a", "b"]);
  });

  it("clears select tool state when another tool becomes active", () => {
    const store = createStore();

    store.getState().actions.setSelectedObjectIds(["a", "b"]);
    store.getState().actions.setActiveTool("draw");

    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual([]);
    expect(store.getState().ui.activeToolId).toBe("draw");
  });
});
