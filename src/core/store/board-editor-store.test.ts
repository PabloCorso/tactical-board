import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "./board-editor-store";
import {
  ARROW_TOOL_ID,
  DEFAULT_ARROW_TOOL_STATE,
  getArrowToolState,
} from "../../tools/arrow-tool-state";
import { createArrowTool } from "../../tools/arrow-tool";
import {
  getSelectToolState,
  SELECT_TOOL_ID,
} from "../../tools/select-tool-state";
import { selectTool } from "../../tools/select-tool";

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
        selectTool,
        {
          id: "draw",
          label: "Draw",
        },
      ],
    });

  it("resets select tool state when switching away", () => {
    const store = createStore();

    store.getState().actions.setToolState(SELECT_TOOL_ID, {
      selectedObjectIds: ["a", "b"],
      interaction: {
        mode: "marquee",
        origin: { x: 1, y: 1 },
        current: { x: 2, y: 2 },
        baseSelection: [],
      },
    });
    store.getState().actions.setActiveTool("draw");

    expect(getSelectToolState(store.getState().toolState)).toEqual({
      selectedObjectIds: [],
      interaction: undefined,
    });
    expect(store.getState().ui.activeToolId).toBe("draw");
  });

  it("clears unfinished arrow drafts when switching tools", () => {
    const arrowTool = createArrowTool();
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
          byId: {},
          order: [],
        },
        style: {},
      },
      initialToolId: ARROW_TOOL_ID,
      tools: [
        selectTool,
        arrowTool,
      ],
    });

    store.getState().actions.setToolState(ARROW_TOOL_ID, {
      ...DEFAULT_ARROW_TOOL_STATE,
      pendingPoints: [{ x: 10, y: 12 }],
    });
    store.getState().actions.setPreviewObjects([
      {
        id: "preview-arrow",
        type: "token",
        position: { x: 0, y: 0 },
        props: {},
      },
    ]);

    store.getState().actions.setActiveTool(SELECT_TOOL_ID);

    expect(store.getState().ui.activeToolId).toBe(SELECT_TOOL_ID);
    expect(getArrowToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(
      getArrowToolState(store.getState().toolState).draftStyle,
    ).toEqual(DEFAULT_ARROW_TOOL_STATE.draftStyle);
    expect(store.getState().rendering.previewObjects).toEqual([]);
  });

  it("uses the first registered tool when no initial tool is provided", () => {
    const store = createStore();

    expect(store.getState().ui.activeToolId).toBe(SELECT_TOOL_ID);
  });

  it("applies the first arrow preset when activating the arrow tool", () => {
    const arrowTool = createArrowTool({
      presets: [
        {
          id: "route",
          label: "Route",
          draftStyle: {
            geometry: "polyline",
            bodyStyle: "straight",
          },
        },
        {
          id: "run",
          label: "Run",
          draftStyle: {
            geometry: "simple",
            bodyStyle: "wavy",
          },
        },
      ],
    });
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
          byId: {},
          order: [],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool],
    });

    store.getState().actions.setToolState(ARROW_TOOL_ID, {
      ...DEFAULT_ARROW_TOOL_STATE,
      draftStyle: {
        ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
        geometry: "simple",
        bodyStyle: "double",
      },
    });

    store.getState().actions.setActiveTool(ARROW_TOOL_ID);

    expect(getArrowToolState(store.getState().toolState).draftStyle).toEqual({
      ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
      geometry: "polyline",
      bodyStyle: "straight",
    });
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
