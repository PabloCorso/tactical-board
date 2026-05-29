import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "./board-editor-store";
import {
  ARROW_TOOL_ID,
  DEFAULT_ARROW_TOOL_STATE,
  getArrowToolState,
} from "../tools/arrow-tool-state";
import { ArrowTool } from "../tools/arrow-tool";
import {
  DEFAULT_PLAYER_TOOL_STATE,
  getPlayerToolState,
  PLAYER_TOOL_ID,
} from "../tools/player-tool-state";
import {
  DEFAULT_SHAPE_TOOL_STATE,
  getShapeToolState,
  SHAPE_TOOL_ID,
} from "../tools/shape-tool-state";
import { ShapeTool } from "../tools/shape-tool";
import { PlayerTool } from "../tools/player-tool";
import { getSelectToolState, SELECT_TOOL_ID } from "../tools/select-tool-state";
import { SelectTool } from "../tools/select-tool";

describe("createBoardEditorStore", () => {
  const selectTool = new SelectTool();
  const createStore = () =>
    createBoardEditorStore({
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
      tools: [
        selectTool,
        {
          id: "draw",
          label: "Draw",
        },
      ],
    });

  it("updates the board frame through history", () => {
    const store = createStore();

    store.getState().actions.setFrame({
      width: 200,
      height: 100,
      background: "#177238",
      markup: {
        sport: "football",
        variant: "half-pitch",
      },
    });

    expect(store.getState().board.frame).toMatchObject({
      width: 200,
      height: 100,
      background: "#177238",
      markup: {
        variant: "half-pitch",
      },
    });

    store.getState().actions.undo();

    expect(store.getState().board.frame).toEqual({
      width: 100,
      height: 50,
    });
  });

  it("keeps the viewport free by default", () => {
    const store = createStore();

    store.getState().actions.setCanvasRect({ width: 220, height: 120 });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 2.2,
    });

    store.getState().actions.setViewport({
      pan: { x: 500, y: -300 },
      zoom: 0.1,
    });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 500, y: -300 },
      zoom: 0.1,
    });
  });

  it("uses fit viewport padding for the initial fit", () => {
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
      fitPadding: { x: 20, y: 10 },
      tools: [selectTool],
    });

    store.getState().actions.setCanvasRect({ width: 220, height: 120 });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 1.8,
    });
  });

  it("fits the initial viewport to objects outside the frame", () => {
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
          byId: {
            outside: {
              id: "outside",
              type: "marker",
              position: {
                x: 120,
                y: 25,
              },
              size: {
                width: 20,
                height: 20,
              },
              props: {},
            },
          },
          order: ["outside"],
        },
        style: {},
      },
      tools: [selectTool],
    });

    store.getState().actions.setCanvasRect({ width: 228, height: 128 });

    expect(store.getState().ui.viewport.zoom).toBeCloseTo(228 / 130);
    expect(store.getState().ui.viewport.pan.x).toBeCloseTo(
      -((130 / 2 - 50) * store.getState().ui.viewport.zoom),
    );
    expect(store.getState().ui.viewport.pan.y).toBe(0);
  });

  it("centers fitted content bounds", () => {
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
          byId: {
            outside: {
              id: "outside",
              type: "marker",
              position: {
                x: 160,
                y: 25,
              },
              size: {
                width: 20,
                height: 20,
              },
              props: {},
            },
          },
          order: ["outside"],
        },
        style: {},
      },
      tools: [selectTool],
    });

    store.getState().actions.setCanvasRect({ width: 400, height: 100 });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: -70, y: 0 },
      zoom: 2,
    });
  });

  it("uses fit viewport padding when fitting contained navigation", () => {
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
      fitPadding: { x: 20, y: 10 },
      tools: [selectTool],
      navigationMode: "contained",
    });

    store.getState().actions.setCanvasRect({ width: 220, height: 120 });
    store.getState().actions.setViewport({
      pan: { x: 0, y: 0 },
      zoom: 1.8,
    });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 1.8,
    });
  });

  it("adjusts free navigation when the canvas size changes", () => {
    const store = createStore();

    store.getState().actions.setCanvasRect({ width: 228, height: 128 });
    store.getState().actions.setCanvasRect({ width: 328, height: 228 });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 3.28,
    });
  });

  it("preserves free navigation zoom ratio when resizing without clamping pan", () => {
    const store = createStore();

    store.getState().actions.setCanvasRect({ width: 228, height: 128 });
    store.getState().actions.setViewport({
      pan: { x: 500, y: -300 },
      zoom: 4.56,
    });

    store.getState().actions.setCanvasRect({ width: 328, height: 228 });

    expect(store.getState().ui.viewport.zoom).toBeCloseTo(6.56);
    expect(store.getState().ui.viewport.pan.x).toBeCloseTo(719.2982456140351);
    expect(store.getState().ui.viewport.pan.y).toBeCloseTo(-431.57894736842104);
  });

  it("constrains contained viewport changes to the fit frame", () => {
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
      tools: [selectTool],
      navigationMode: "contained",
    });

    store.getState().actions.setCanvasRect({ width: 228, height: 128 });
    store.getState().actions.setViewport({
      pan: { x: 500, y: -300 },
      zoom: 0.5,
    });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 2.28,
    });

    store.getState().actions.setViewport({
      pan: { x: 500, y: -300 },
      zoom: 4,
    });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 86, y: -36 },
      zoom: 4,
    });

    store.getState().actions.panViewport({ x: -300, y: 300 });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: -86, y: 36 },
      zoom: 4,
    });
  });

  it("refits contained navigation when the canvas size changes", () => {
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
      tools: [selectTool],
      navigationMode: "contained",
    });

    store.getState().actions.setCanvasRect({ width: 228, height: 128 });
    store.getState().actions.setViewport({
      pan: { x: 0, y: 0 },
      zoom: 2.28,
    });

    store.getState().actions.setCanvasRect({ width: 328, height: 228 });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 3.28,
    });
  });

  it("allows contained navigation to fit below the manual minimum zoom", () => {
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        frame: {
          width: 1000,
          height: 600,
        },
        objects: {
          byId: {},
          order: [],
        },
        style: {},
      },
      tools: [selectTool],
      navigationMode: "contained",
    });

    store.getState().actions.setCanvasRect({ width: 1000, height: 600 });
    store.getState().actions.setViewport({
      pan: { x: 0, y: 0 },
      zoom: 1,
    });
    store.getState().actions.setCanvasRect({ width: 420, height: 280 });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 0.42,
    });
  });

  it("preserves contained navigation zoom ratio when resizing the canvas", () => {
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
      tools: [selectTool],
      navigationMode: "contained",
    });

    store.getState().actions.setCanvasRect({ width: 228, height: 128 });
    store.getState().actions.setViewport({
      pan: { x: 40, y: -20 },
      zoom: 4.56,
    });

    store.getState().actions.setCanvasRect({ width: 328, height: 228 });

    expect(store.getState().ui.viewport.zoom).toBeCloseTo(6.56);
    expect(store.getState().ui.viewport.pan.x).toBeCloseTo(57.54385964912281);
    expect(store.getState().ui.viewport.pan.y).toBeCloseTo(-28.771929824561404);
  });

  it("uses fit padding when constraining navigation", () => {
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
      tools: [selectTool],
      fitPadding: 14,
      navigationMode: "contained",
    });

    store.getState().actions.setCanvasRect({ width: 228, height: 128 });
    store.getState().actions.setViewport({
      pan: { x: 500, y: -300 },
      zoom: 4,
    });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 100, y: -50 },
      zoom: 4,
    });
  });

  it("preserves editor selection and resets select interaction when switching away", () => {
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
      tools: [
        selectTool,
        {
          id: "draw",
          label: "Draw",
        },
      ],
    });

    store.getState().actions.setSelectedObjectIds(["a", "b"]);
    store.getState().actions.setToolState(SELECT_TOOL_ID, {
      interaction: {
        mode: "marquee",
        origin: { x: 1, y: 1 },
        current: { x: 2, y: 2 },
        baseSelection: [],
      },
    });
    store.getState().actions.setActiveTool("draw");

    expect(getSelectToolState(store.getState().toolState)).toEqual({
      interaction: undefined,
    });
    expect(store.getState().selection.selectedObjectIds).toEqual(["a", "b"]);
    expect(store.getState().ui.activeToolId).toBe("draw");
  });

  it("clears unfinished arrow drafts when switching tools", () => {
    const arrowTool = new ArrowTool();
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
    expect(store.getState().ui.defaultToolId).toBe(SELECT_TOOL_ID);
  });

  it("stores the resolved initial tool as the default tool", () => {
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
      initialToolId: "draw",
      tools: [
        selectTool,
        {
          id: "draw",
          label: "Draw",
        },
      ],
    });

    expect(store.getState().ui.activeToolId).toBe("draw");
    expect(store.getState().ui.defaultToolId).toBe("draw");
  });

  it("applies the first arrow default when activating the arrow tool", () => {
    const arrowTool = new ArrowTool({
      defaults: [
        {
          id: "run",
          label: "Run",
          draftStyle: {
            kind: "wavy",
          },
        },
        {
          id: "screen",
          label: "Screen",
          draftStyle: {
            kind: "double",
          },
        },
      ],
    });
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
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool],
    });

    store.getState().actions.setToolState(ARROW_TOOL_ID, {
      ...DEFAULT_ARROW_TOOL_STATE,
      draftStyle: {
        ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
        kind: "double",
      },
    });

    store.getState().actions.setActiveTool(ARROW_TOOL_ID);

    expect(getArrowToolState(store.getState().toolState).draftStyle).toEqual({
      ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
      kind: "wavy",
    });
  });

  it("applies the first player default when activating the player tool", () => {
    const playerTool = new PlayerTool({
      defaults: [
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
        frame: {
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
    expect(store.getState().selection.selectedObjectIds).toEqual([]);
  });

  it("deletes objects and removes deleted ids from selection", () => {
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

    store.getState().actions.setSelectedObjectIds(["a", "b"]);
    store.getState().actions.deleteObjects(["b"]);

    expect(store.getState().board.objects.order).toEqual(["a"]);
    expect(store.getState().board.objects.byId.b).toBeUndefined();
    expect(store.getState().selection.selectedObjectIds).toEqual(["a"]);
  });

  it("brings an object to the front of its semantic layer", () => {
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
          byId: {
            "player-1": {
              id: "player-1",
              type: "player",
              position: { x: 10, y: 12 },
              props: {},
            },
            "shape-1": {
              id: "shape-1",
              type: "shape",
              position: { x: 20, y: 22 },
              props: {},
            },
            "player-2": {
              id: "player-2",
              type: "player",
              position: { x: 30, y: 32 },
              props: {},
            },
          },
          order: ["player-1", "shape-1", "player-2"],
        },
        style: {},
      },
      tools: [{ id: SELECT_TOOL_ID, label: "Select" }],
    });

    store.getState().actions.bringObjectsToFront(["player-1"]);

    expect(store.getState().board.objects.order).toEqual([
      "player-2",
      "shape-1",
      "player-1",
    ]);
  });

  it("sends an object to the back of its semantic layer", () => {
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
          byId: {
            "player-1": {
              id: "player-1",
              type: "player",
              position: { x: 10, y: 12 },
              props: {},
            },
            "shape-1": {
              id: "shape-1",
              type: "shape",
              position: { x: 20, y: 22 },
              props: {},
            },
            "player-2": {
              id: "player-2",
              type: "player",
              position: { x: 30, y: 32 },
              props: {},
            },
          },
          order: ["player-1", "shape-1", "player-2"],
        },
        style: {},
      },
      tools: [{ id: SELECT_TOOL_ID, label: "Select" }],
    });

    store.getState().actions.sendObjectsToBack(["player-2"]);

    expect(store.getState().board.objects.order).toEqual([
      "player-2",
      "shape-1",
      "player-1",
    ]);
  });

  it("undoes and redoes board mutations while restoring selection but not editor ui state", () => {
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
    store.getState().actions.setSelectedObjectIds(["a"]);
    store.getState().actions.moveObjects(["a"], { x: 5, y: -2 });
    store.getState().actions.setSelectedObjectIds([]);
    store.getState().actions.setToolState(SELECT_TOOL_ID, {
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
    expect(store.getState().selection.selectedObjectIds).toEqual(["a"]);
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
    expect(store.getState().selection.selectedObjectIds).toEqual([]);
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.future).toHaveLength(0);
  });

  it("clears redo history when a new board change branches from undo", () => {
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
        frame: {
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

    store.getState().actions.setSelectedObjectIds(["a"]);

    expect(store.getState().history.past).toHaveLength(0);

    store.getState().actions.undo();

    expect(store.getState().selection.selectedObjectIds).toEqual(["a"]);
  });

  it("collapses batched board mutations into a single undo step", () => {
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
