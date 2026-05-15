import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "./board-editor-store";
import {
  ARROW_TOOL_ID,
  DEFAULT_ARROW_TOOL_STATE,
  getArrowToolState,
} from "../../tools/arrow-tool-state";
import { ArrowTool } from "../../tools/arrow-tool";
import {
  DEFAULT_PLAYER_TOOL_STATE,
  getPlayerToolState,
  PLAYER_TOOL_ID,
} from "../../tools/player-tool-state";
import {
  DEFAULT_SHAPE_TOOL_STATE,
  getShapeToolState,
  SHAPE_TOOL_ID,
} from "../../tools/shape-tool-state";
import { ShapeTool } from "../../tools/shape-tool";
import { PlayerTool } from "../../tools/player-tool";
import {
  getSelectToolState,
  SELECT_TOOL_ID,
} from "../../tools/select-tool-state";
import { SelectTool } from "../../tools/select-tool";

describe("createBoardEditorStore", () => {
  const selectTool = new SelectTool();
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
    const arrowTool = new ArrowTool();
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
      tools: [selectTool, arrowTool],
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
    expect(getArrowToolState(store.getState().toolState).draftStyle).toEqual(
      DEFAULT_ARROW_TOOL_STATE.draftStyle,
    );
    expect(store.getState().rendering.previewObjects).toEqual([]);
  });

  it("clears unfinished shape drafts when switching tools", () => {
    const shapeTool = new ShapeTool();
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
      initialToolId: SHAPE_TOOL_ID,
      tools: [selectTool, shapeTool],
    });

    store.getState().actions.setToolState(SHAPE_TOOL_ID, {
      ...DEFAULT_SHAPE_TOOL_STATE,
      pendingPoints: [
        { x: 10, y: 12 },
        { x: 14, y: 16 },
        { x: 12, y: 20 },
      ],
    });
    store.getState().actions.setPreviewObjects([
      {
        id: "preview-shape",
        type: "token",
        position: { x: 0, y: 0 },
        props: {},
      },
    ]);

    store.getState().actions.setActiveTool(SELECT_TOOL_ID);

    expect(store.getState().ui.activeToolId).toBe(SELECT_TOOL_ID);
    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(getShapeToolState(store.getState().toolState).draftStyle).toEqual(
      DEFAULT_SHAPE_TOOL_STATE.draftStyle,
    );
    expect(store.getState().rendering.previewObjects).toEqual([]);
  });

  it("uses the first registered tool when no initial tool is provided", () => {
    const store = createStore();

    expect(store.getState().ui.activeToolId).toBe(SELECT_TOOL_ID);
  });

  it("applies the first arrow preset when activating the arrow tool", () => {
    const arrowTool = new ArrowTool({
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

  it("applies the first player preset when activating the player tool", () => {
    const playerTool = new PlayerTool({
      presets: [
        {
          id: "home",
          label: "Home",
          draftStyle: {
            color: "#1f6feb",
            size: 2.4,
          },
        },
        {
          id: "away",
          label: "Away",
          draftStyle: {
            color: "#ff6b35",
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
      tools: [selectTool, playerTool],
    });

    store.getState().actions.setToolState(PLAYER_TOOL_ID, {
      ...DEFAULT_PLAYER_TOOL_STATE,
      draftStyle: {
        ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
        color: "#111827",
        size: 3,
      },
    });

    store.getState().actions.setActiveTool(PLAYER_TOOL_ID);

    expect(getPlayerToolState(store.getState().toolState).draftStyle).toEqual({
      ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
      color: "#1f6feb",
      size: 2.4,
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

  it("undoes and redoes board mutations while restoring selection but not editor ui state", () => {
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
      tools: [
        { id: SELECT_TOOL_ID, label: "Select" },
        { id: "draw", label: "Draw" },
      ],
    });

    store.getState().actions.setActiveTool("draw");
    store.getState().actions.setViewport({
      pan: { x: 20, y: 30 },
      zoom: 1.5,
    });
    store.getState().actions.setToolState(SELECT_TOOL_ID, {
      selectedObjectIds: ["a"],
    });
    store.getState().actions.moveObjects(["a"], { x: 5, y: -2 });
    store.getState().actions.setToolState(SELECT_TOOL_ID, {
      selectedObjectIds: [],
      interaction: {
        mode: "marquee",
        origin: { x: 0, y: 0 },
        current: { x: 1, y: 1 },
        baseSelection: [],
      },
    });

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 15,
      y: 10,
    });
    expect(store.getState().history.past).toHaveLength(1);

    store.getState().actions.undo();

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 10,
      y: 12,
    });
    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual(["a"]);
    expect(getSelectToolState(store.getState().toolState).interaction).toBe(
      undefined,
    );
    expect(store.getState().ui.activeToolId).toBe("draw");
    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 20, y: 30 },
      zoom: 1.5,
    });
    expect(store.getState().history.future).toHaveLength(1);

    store.getState().actions.redo();

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 15,
      y: 10,
    });
    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual([]);
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.future).toHaveLength(0);
  });

  it("clears redo history when a new board change branches from undo", () => {
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

    store.getState().actions.moveObjects(["a"], { x: 5, y: 0 });
    store.getState().actions.undo();

    expect(store.getState().history.future).toHaveLength(1);

    store.getState().actions.moveObjects(["a"], { x: 0, y: 7 });

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 10,
      y: 19,
    });
    expect(store.getState().history.future).toHaveLength(0);

    store.getState().actions.redo();

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 10,
      y: 19,
    });
  });

  it("does not create history entries for selection-only changes", () => {
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

    store.getState().actions.setToolState(SELECT_TOOL_ID, {
      selectedObjectIds: ["a"],
    });

    expect(store.getState().history.past).toHaveLength(0);

    store.getState().actions.undo();

    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual(["a"]);
  });

  it("collapses batched board mutations into a single undo step", () => {
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

    store.getState().actions.beginHistoryBatch();
    store.getState().actions.moveObjects(["a"], { x: 2, y: 0 });
    store.getState().actions.moveObjects(["a"], { x: 0, y: 3 });
    store.getState().actions.endHistoryBatch();

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 12,
      y: 15,
    });
    expect(store.getState().history.past).toHaveLength(1);

    store.getState().actions.undo();

    expect(store.getState().board.objects.byId.a?.position).toEqual({
      x: 10,
      y: 12,
    });
  });
});
