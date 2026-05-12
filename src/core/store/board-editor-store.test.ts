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

  it("switches active tools without mutating tool state", () => {
    const store = createStore();

    store.getState().actions.setToolState(SELECT_TOOL_ID, {
      selectedObjectIds: ["a", "b"],
    });
    store.getState().actions.setActiveTool("draw");

    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual(["a", "b"]);
    expect(store.getState().ui.activeToolId).toBe("draw");
  });

  it("uses the first registered tool when no initial tool is provided", () => {
    const store = createStore();

    expect(store.getState().ui.activeToolId).toBe(SELECT_TOOL_ID);
  });

  it("duplicates objects without changing select tool state", () => {
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {
            a: {
              id: "a",
              type: "token",
              position: { x: 10, y: 12 },
              props: {},
            },
          },
          order: ["a"],
        },
        style: {},
      },
      tools: [{ id: SELECT_TOOL_ID, label: "Select" }],
    });

    const duplicateIds = store.getState().actions.duplicateObjects(["a"]);

    expect(duplicateIds).toEqual(["a-copy"]);
    expect(store.getState().board.objects.order).toEqual(["a", "a-copy"]);
    expect(store.getState().board.objects.byId["a-copy"]).toMatchObject({
      id: "a-copy",
      position: { x: 12, y: 14 },
    });
    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual([]);
  });

  it("deletes objects without mutating select tool state", () => {
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
        },
        objects: {
          byId: {
            a: {
              id: "a",
              type: "token",
              position: { x: 10, y: 12 },
              props: {},
            },
            b: {
              id: "b",
              type: "token",
              position: { x: 20, y: 22 },
              props: {},
            },
          },
          order: ["a", "b"],
        },
        style: {},
      },
      tools: [{ id: SELECT_TOOL_ID, label: "Select" }],
    });

    store.getState().actions.setToolState(SELECT_TOOL_ID, {
      selectedObjectIds: ["a", "b"],
    });
    store.getState().actions.deleteObjects(["b"]);

    expect(store.getState().board.objects.order).toEqual(["a"]);
    expect(store.getState().board.objects.byId.b).toBeUndefined();
    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual(["a", "b"]);
  });
});
