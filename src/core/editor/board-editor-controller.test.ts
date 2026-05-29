import { describe, expect, it, vi } from "vitest";
import { createBoardEditorController } from "./board-editor-controller";
import { createToolApi } from "./create-tool-api";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import { createBoardEditorStore } from "../store/board-editor-store";
import type { Board, BoardObject, Point } from "../board/types";
import {
  createArrowObject,
  getArrowCurveHandlePoint,
  type ArrowObject,
} from "../objects/arrow-object";
import {
  createEquipmentObject,
  type EquipmentDefinition,
} from "../objects/equipment-object";
import { getEquipmentSelectionOutlineCanvasPoints } from "../tools/equipment-geometry";
import {
  createPlayerObject,
  type PlayerObject,
} from "../objects/player-object";
import { createShapeObject, type ShapeObject } from "../objects/shape-object";
import { ArrowTool } from "../tools/arrow-tool";
import { getArrowSelectionCanvasBounds } from "../tools/arrow-selection";
import { EquipmentTool } from "../tools/equipment-tool";
import { PlayerTool } from "../tools/player-tool";
import { getPlayerSelectionOutlineCanvasPoints } from "../tools/player-selection";
import { getShapeSelectionOutlineCanvasPoints } from "../tools/shape-selection";
import { ShapeTool } from "../tools/shape-tool";
import { SelectTool } from "../tools/select-tool";
import { setSelectedObjectIds } from "../tools/select-tool-actions";
import { TextTool } from "../tools/text-tool";
import { getArrowToolState } from "../tools/arrow-tool-state";
import { getPlayerToolState, PLAYER_TOOL_ID } from "../tools/player-tool-state";
import { SELECT_TOOL_ID } from "../tools/select-tool-state";
import { getShapeToolState } from "../tools/shape-tool-state";
import { getTextToolState, TEXT_TOOL_ID } from "../tools/text-tool-state";
import type { ToolDefinition } from "../tools/types";
import { BOARD_PLAYER_DEFAULT_COLORS } from "../../react/board/theme/board-tool-defaults";
import { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM } from "./viewport-utils";
import {
  getCornerHandleCanvasPoint,
  getRotatedRectBoardPoints,
  rotateOffset,
} from "../tools/selection-geometry";

describe("createBoardEditorController", () => {
  const selectTool = new SelectTool();
  const canvasRect = {
    left: 0,
    top: 0,
    width: 1000,
    height: 500,
  };
  const createTestBoard = (objects: BoardObject[] = []): Board => ({
    id: "board-1",
    version: 1,
    metadata: {},
    frame: {
      width: 100,
      height: 50,
    },
    objects: {
      byId: Object.fromEntries(objects.map((object) => [object.id, object])),
      order: objects.map((object) => object.id),
    },
    style: {},
  });
  const createEditorHarness = ({
    initialToolId,
    tools = [],
    objects = [],
    selectedObjectIds = [],
  }: {
    initialToolId: string;
    tools?: ToolDefinition[];
    objects?: BoardObject[];
    selectedObjectIds?: string[];
  }) => {
    const store = createBoardEditorStore({
      initialBoard: createTestBoard(objects),
      initialToolId,
      tools: [selectTool, ...tools],
    });
    const toolApi = createToolApi(store);

    for (const tool of tools) {
      tool.registerCapabilities?.(toolApi);
    }
    if (selectedObjectIds.length > 0) {
      setSelectedObjectIds(toolApi, selectedObjectIds);
    }

    const controller = createBoardEditorController(store);
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const dispatchPointer = (
      handlerName: "onPointerDown" | "onPointerMove" | "onPointerUp",
      clientPoint: Point,
      overrides: Partial<{
        pointerId: number;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        metaKey: boolean;
        button: number;
      }> = {},
    ) =>
      controller.dispatchPointerEvent(handlerName, {
        clientPoint,
        pointerId: overrides.pointerId ?? 1,
        ctrlKey: overrides.ctrlKey ?? false,
        shiftKey: overrides.shiftKey ?? false,
        altKey: overrides.altKey ?? false,
        metaKey: overrides.metaKey ?? false,
        button: overrides.button,
        canvasRect,
      });

    return {
      store,
      toolApi,
      controller,
      projection,
      dispatchPointer,
      boardToCanvas: projection.boardToCanvas,
    };
  };
  const setPlayerDraftStyle = (
    toolApi: ReturnType<typeof createToolApi>,
    draftStyle: Partial<ReturnType<typeof getPlayerToolState>["draftStyle"]>,
  ) => {
    const playerState = getPlayerToolState(toolApi.getState().toolState);
    toolApi.setToolState(PLAYER_TOOL_ID, {
      ...playerState,
      draftStyle: {
        ...playerState.draftStyle,
        ...draftStyle,
      },
    });
  };
  const setTextDraftStyle = (
    toolApi: ReturnType<typeof createToolApi>,
    draftStyle: Partial<ReturnType<typeof getTextToolState>["draftStyle"]>,
  ) => {
    const textState = getTextToolState(toolApi.getState().toolState);
    toolApi.setToolState(TEXT_TOOL_ID, {
      ...textState,
      draftStyle: {
        ...textState.draftStyle,
        ...draftStyle,
      },
    });
  };
  const getMultiSelectionCanvasBounds = (
    projection: ReturnType<typeof createBoardSpaceProjection>,
    players: PlayerObject[],
  ) => {
    const points = players.flatMap((player) =>
      getPlayerSelectionOutlineCanvasPoints(projection, player),
    );

    return {
      left: Math.min(...points.map((point) => point.x)),
      right: Math.max(...points.map((point) => point.x)),
      top: Math.min(...points.map((point) => point.y)),
      bottom: Math.max(...points.map((point) => point.y)),
    };
  };
  const getMixedSelectionCanvasBounds = (
    projection: ReturnType<typeof createBoardSpaceProjection>,
    objects: BoardObject[],
  ) => {
    const bounds = objects.map((object) => {
      if (object.type === "player") {
        const points = getPlayerSelectionOutlineCanvasPoints(
          projection,
          object as PlayerObject,
        );

        return {
          left: Math.min(...points.map((point) => point.x)),
          right: Math.max(...points.map((point) => point.x)),
          top: Math.min(...points.map((point) => point.y)),
          bottom: Math.max(...points.map((point) => point.y)),
        };
      }

      if (object.type === "shape") {
        const points = getShapeSelectionOutlineCanvasPoints(
          projection,
          object as ShapeObject,
        );

        return {
          left: Math.min(...points.map((point) => point.x)),
          right: Math.max(...points.map((point) => point.x)),
          top: Math.min(...points.map((point) => point.y)),
          bottom: Math.max(...points.map((point) => point.y)),
        };
      }

      if (object.type === "arrow") {
        return getArrowSelectionCanvasBounds(projection, object as ArrowObject);
      }

      const objectBounds = projection.getObjectCanvasBounds(object);

      return {
        left: objectBounds.x,
        right: objectBounds.x + objectBounds.width,
        top: objectBounds.y,
        bottom: objectBounds.y + objectBounds.height,
      };
    });

    return {
      left: Math.min(...bounds.map((bound) => bound.left)),
      right: Math.max(...bounds.map((bound) => bound.right)),
      top: Math.min(...bounds.map((bound) => bound.top)),
      bottom: Math.max(...bounds.map((bound) => bound.bottom)),
    };
  };
  it("keeps the arrow tool in creation mode when pointer down hits an existing arrow", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
    });
    const { dispatchPointer, boardToCanvas, store } = createEditorHarness({
      initialToolId: arrowTool.id,
      tools: [arrowTool],
      objects: [existingArrow],
    });
    const startPoint = boardToCanvas(existingArrow.props.start);
    const endPoint = boardToCanvas({ x: 30, y: 15 });

    dispatchPointer("onPointerDown", startPoint);

    expect(store.getState().selection.selectedObjectIds).toEqual([]);
    expect(getArrowToolState(store.getState().toolState).pendingPoints).toEqual(
      [
        {
          x: 10,
          y: 10,
        },
      ],
    );

    dispatchPointer("onPointerDown", endPoint);

    expect(store.getState().board.objects.order).toEqual([
      "arrow-1",
      "arrow-2",
    ]);
    expect(store.getState().selection.selectedObjectIds).toEqual([]);
    expect(getArrowToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().board.objects.byId["arrow-2"]).toMatchObject({
      type: "arrow",
      props: {
        start: { x: 10, y: 10 },
        end: { x: 30, y: 15 },
      },
    });
  });

  it("shows a player ghost preview at the pointer before placement", () => {
    const playerTool = new PlayerTool();
    const { boardToCanvas, dispatchPointer, store } = createEditorHarness({
      initialToolId: playerTool.id,
      tools: [playerTool],
    });
    const previewPoint = boardToCanvas({ x: 25, y: 12 });

    dispatchPointer("onPointerMove", previewPoint);

    expect(store.getState().rendering.previewObjects).toHaveLength(1);
    expect(store.getState().rendering.previewObjects[0]).toMatchObject({
      id: "player-preview",
      type: "player",
      position: { x: 25, y: 12 },
    });
  });

  it("does not show a text preview at the pointer before placement", () => {
    const textTool = new TextTool();
    const { boardToCanvas, dispatchPointer, store, toolApi } =
      createEditorHarness({
        initialToolId: textTool.id,
        tools: [textTool],
      });
    setTextDraftStyle(toolApi, { fontSize: 28 });

    const previewPoint = boardToCanvas({ x: 25, y: 12 });

    dispatchPointer("onPointerMove", previewPoint);

    expect(store.getState().rendering.previewObjects).toEqual([]);
  });

  it("starts inline text editing at the clicked point", () => {
    const textTool = new TextTool();
    const { boardToCanvas, dispatchPointer, store, toolApi } =
      createEditorHarness({
        initialToolId: textTool.id,
        tools: [textTool],
      });
    setTextDraftStyle(toolApi, {
      color: "#16a34a",
      fontSize: 30,
    });

    const placementPoint = boardToCanvas({ x: 30, y: 18 });

    dispatchPointer("onPointerDown", placementPoint);

    expect(store.getState().board.objects.order).toEqual(["text-1"]);
    expect(store.getState().board.objects.byId["text-1"]).toMatchObject({
      type: "text",
      props: {
        text: "",
        color: "#16a34a",
        fontSize: 30,
      },
      size: {},
    });
    expect(store.getState().selection.selectedObjectIds).toEqual(["text-1"]);
    const editingSession = getTextToolState(
      store.getState().toolState,
    ).editingSession;
    expect(editingSession?.objectId).toBe("text-1");
    expect(editingSession?.anchorPosition.x).toBeCloseTo(30);
    expect(editingSession?.anchorPosition.y).toBeCloseTo(18);
  });

  it("prefers players over overlapping shapes during hit testing", () => {
    const shape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      color: "#f00",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
      start: { x: 21, y: 8 },
      end: { x: 29, y: 16 },
    });
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 25, y: 12 },
      color: "#111827",
    });
    const { boardToCanvas, controller } = createEditorHarness({
      initialToolId: selectTool.id,
      objects: [player, shape],
    });
    const targetPoint = boardToCanvas(player.position);

    expect(
      controller.createToolPointerEvent({
        clientPoint: targetPoint,
        pointerId: 1,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        canvasRect,
      }).targetObjectId,
    ).toBe(player.id);
  });

  it("shows an equipment ghost preview at the pointer before placement", () => {
    const equipmentTool = new EquipmentTool({
      definitions: [
        {
          kind: "football-cone",
          label: "Football Cone",
          defaultSize: { width: 1.8, height: 2.2 },
          color: "#ff6b35",
          lockedAspectRatio: true,
        },
      ],
    });
    const { boardToCanvas, dispatchPointer, store } = createEditorHarness({
      initialToolId: equipmentTool.id,
      tools: [equipmentTool],
    });
    const previewPoint = boardToCanvas({ x: 32, y: 18 });

    dispatchPointer("onPointerMove", previewPoint);

    expect(store.getState().rendering.previewObjects).toHaveLength(1);
    expect(store.getState().rendering.previewObjects[0]).toMatchObject({
      id: "equipment-preview",
      type: "equipment",
      position: { x: 32, y: 18 },
      props: {
        kind: "football-cone",
        color: "#ff6b35",
      },
    });
  });

  it("resizes a selected arrow by dragging an endpoint handle", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
    });
    const { dispatchPointer, boardToCanvas, store } = createEditorHarness({
      initialToolId: SELECT_TOOL_ID,
      tools: [arrowTool],
      objects: [existingArrow],
      selectedObjectIds: [existingArrow.id],
    });
    const endPoint = boardToCanvas(existingArrow.props.end);
    const middleEndPoint = boardToCanvas({ x: 28, y: 14 });
    const nextEndPoint = boardToCanvas({ x: 35, y: 18 });

    dispatchPointer("onPointerDown", endPoint);
    dispatchPointer("onPointerMove", middleEndPoint);
    dispatchPointer("onPointerMove", nextEndPoint);
    dispatchPointer("onPointerUp", nextEndPoint);

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 10, y: 10 },
          end: { x: 35, y: 18 },
        },
      },
    );
    expect(store.getState().history.past).toHaveLength(1);

    store.getState().actions.undo();

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 10, y: 10 },
          end: { x: 20, y: 10 },
        },
      },
    );
  });

  it("resizes a selected shape by dragging a selection edge", () => {
    const arrowTool = new ArrowTool();
    const shapeTool = new ShapeTool();
    const existingShape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      color: "#fff",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
    });
    const { dispatchPointer, boardToCanvas, store } = createEditorHarness({
      initialToolId: SELECT_TOOL_ID,
      tools: [arrowTool, shapeTool],
      objects: [existingShape],
      selectedObjectIds: [existingShape.id],
    });
    const rightHandle = boardToCanvas({ x: 20, y: 14 });
    const nextRightHandle = boardToCanvas({ x: 30, y: 14 });

    dispatchPointer("onPointerDown", rightHandle);
    dispatchPointer("onPointerMove", nextRightHandle);

    expect(store.getState().board.objects.byId[existingShape.id]).toMatchObject(
      {
        props: {
          start: { x: 10, y: 10 },
          end: { x: 30, y: 18 },
        },
      },
    );
  });

  it("drags a shape with no fill from its transparent interior", () => {
    const shapeTool = new ShapeTool();
    const existingShape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      color: "#fff",
      lineStyle: "solid",
      fillStyle: "none",
      bordered: true,
    });
    const { dispatchPointer, boardToCanvas, store } = createEditorHarness({
      initialToolId: SELECT_TOOL_ID,
      tools: [shapeTool],
      objects: [existingShape],
    });
    const interiorPoint = boardToCanvas({ x: 15, y: 14 });
    const nextInteriorPoint = boardToCanvas({ x: 25, y: 19 });

    dispatchPointer("onPointerDown", interiorPoint);
    dispatchPointer("onPointerMove", nextInteriorPoint);

    expect(store.getState().selection.selectedObjectIds).toEqual([
      existingShape.id,
    ]);
    expect(store.getState().board.objects.byId[existingShape.id]).toMatchObject(
      {
        position: { x: 25, y: 19 },
        props: {
          start: { x: 20, y: 15 },
          end: { x: 30, y: 23 },
        },
      },
    );
  });

  it("places players with numeric labels sequenced by color", () => {
    const playerTool = new PlayerTool();
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
      initialToolId: playerTool.id,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });

    const firstBlue = projection.boardToCanvas({ x: 10, y: 10 });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: firstBlue,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const secondBlue = projection.boardToCanvas({ x: 20, y: 10 });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: secondBlue,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    setPlayerDraftStyle(toolApi, { color: "#ff6b35" });
    const firstOrange = projection.boardToCanvas({ x: 30, y: 10 });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: firstOrange,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    setPlayerDraftStyle(toolApi, { color: "#1f1f1f" });
    const firstBlack = projection.boardToCanvas({ x: 40, y: 10 });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: firstBlack,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    setPlayerDraftStyle(toolApi, { color: "#ff6b35" });
    const secondOrange = projection.boardToCanvas({ x: 50, y: 10 });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: secondOrange,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual([
      "player-1",
      "player-2",
      "player-3",
      "player-4",
      "player-5",
    ]);
    expect(store.getState().board.objects.byId["player-1"]).toMatchObject({
      type: "player",
      props: { label: "1", color: "#1f1f1f" },
    });
    expect(store.getState().board.objects.byId["player-2"]).toMatchObject({
      type: "player",
      props: { label: "2", color: "#1f1f1f" },
    });
    expect(store.getState().board.objects.byId["player-3"]).toMatchObject({
      type: "player",
      props: { label: "1", color: "#ff6b35" },
    });
    expect(store.getState().board.objects.byId["player-4"]).toMatchObject({
      type: "player",
      props: { label: "3", color: "#1f1f1f" },
    });
    expect(store.getState().board.objects.byId["player-5"]).toMatchObject({
      type: "player",
      props: { label: "2", color: "#ff6b35" },
    });
    expect(
      getPlayerToolState(store.getState().toolState).nextNumericLabelByColor,
    ).toEqual({
      "#1f1f1f": 4,
      "#ff6b35": 3,
    });
  });

  it("seeds player numbering from existing players on the board", () => {
    const playerTool = new PlayerTool();
    const existingBluePlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      color: "#1f6feb",
      label: "1",
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
          byId: {
            [existingBluePlayer.id]: existingBluePlayer,
          },
          order: [existingBluePlayer.id],
        },
        style: {},
      },
      initialToolId: playerTool.id,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setPlayerDraftStyle(toolApi, { color: "#1f6feb" });

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const nextBlue = projection.boardToCanvas({ x: 20, y: 10 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: nextBlue,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId["player-2"]).toMatchObject({
      type: "player",
      props: { color: "#1f6feb", label: "2" },
    });
    expect(
      getPlayerToolState(store.getState().toolState).nextNumericLabelByColor,
    ).toEqual({
      "#1f6feb": 3,
    });
  });

  it("places the next per-color player number after existing players", () => {
    const playerTool = new PlayerTool({
      defaults: BOARD_PLAYER_DEFAULT_COLORS.slice(0, 6).map((color, index) => ({
        id: `team-color-${index + 1}`,
        label: String(index + 1),
        draftStyle: { color },
      })),
    });
    const existingPlayers = BOARD_PLAYER_DEFAULT_COLORS.slice(0, 6).map(
      (color, index) =>
        createPlayerObject({
          id: `player-${index + 1}`,
          position: { x: 10 + index * 5, y: 10 },
          color,
          label: "1",
        }),
    );
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
          byId: Object.fromEntries(
            existingPlayers.map((player) => [player.id, player]),
          ),
          order: existingPlayers.map((player) => player.id),
        },
        style: {},
      },
      initialToolId: selectTool.id,
      tools: [selectTool, playerTool],
    });

    store.getState().actions.setActiveTool(playerTool.id);
    createBoardEditorController(store).dispatchPointerEvent("onPointerDown", {
      clientPoint: { x: 40, y: 20 },
      canvasRect: { left: 0, top: 0, width: 800, height: 400 },
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });

    const placedPlayers = Object.values(
      store.getState().board.objects.byId,
    ).filter((object): object is PlayerObject => object.type === "player");

    expect(placedPlayers).toHaveLength(7);
    expect(placedPlayers.at(-1)?.props.label).toBe("2");
  });

  it("places equipment using the selected catalog definition", () => {
    const equipmentDefinitions: EquipmentDefinition[] = [
      {
        kind: "cone",
        label: "Cone",
        defaultSize: { width: 1.8, height: 2.2 },
        color: "#ff6b35",
        capabilities: { color: true },
        lockedAspectRatio: true,
      },
    ];
    const equipmentTool = new EquipmentTool({
      definitions: equipmentDefinitions,
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
      initialToolId: equipmentTool.id,
      tools: [selectTool, equipmentTool],
    });
    const toolApi = createToolApi(store);
    equipmentTool.registerCapabilities?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const point = projection.boardToCanvas({ x: 16, y: 12 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: point,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId["equipment-1"]).toMatchObject({
      type: "equipment",
      position: { x: 16, y: 12 },
      size: { width: 1.8, height: 2.2 },
      props: {
        kind: "cone",
        color: "#ff6b35",
      },
    });
  });

  it("moves a selected player instead of resizing when dragging a corner", () => {
    const playerTool = new PlayerTool();
    const existingPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      size: { width: 2, height: 2 },
      color: "#1f6feb",
      label: "1",
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
          byId: {
            [existingPlayer.id]: existingPlayer,
          },
          order: [existingPlayer.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingPlayer.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });

    const bottomRightHandle = projection.boardToCanvas({ x: 11, y: 11 });
    const nextSizeHandle = projection.boardToCanvas({ x: 12, y: 12 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: bottomRightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextSizeHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const movedPlayer = store.getState().board.objects.byId[existingPlayer.id];
    expect(movedPlayer?.position.x).toBeCloseTo(11);
    expect(movedPlayer?.position.y).toBeCloseTo(11);
    expect(movedPlayer?.size).toMatchObject({ width: 2, height: 2 });
  });

  it("rotates a selected player by dragging the rotation handle", () => {
    const playerTool = new PlayerTool();
    const existingPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      size: { width: 2, height: 2 },
      color: "#1f6feb",
      label: "1",
    });
    existingPlayer.props.transformCapabilities = {
      ...existingPlayer.props.transformCapabilities,
      rotate: true,
    };
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
            [existingPlayer.id]: existingPlayer,
          },
          order: [existingPlayer.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingPlayer.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const rotationHandle = getCornerHandleCanvasPoint(
      getPlayerSelectionOutlineCanvasPoints(projection, existingPlayer),
      3,
      18,
    );
    const rightOfCenter = projection.boardToCanvas({ x: 12, y: 10 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rotationHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: rightOfCenter,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(
      store.getState().board.objects.byId[existingPlayer.id]?.rotation,
    ).toBeCloseTo(225);
  });

  it("does not snap a selected player rotation on the initial drag", () => {
    const playerTool = new PlayerTool();
    const existingPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      rotation: 30,
      size: { width: 2.5, height: 2.5 },
      color: "#111827",
      label: "1",
    });
    existingPlayer.props.transformCapabilities = {
      ...existingPlayer.props.transformCapabilities,
      rotate: true,
    };
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
            [existingPlayer.id]: existingPlayer,
          },
          order: [existingPlayer.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingPlayer.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const rotationHandle = getCornerHandleCanvasPoint(
      getPlayerSelectionOutlineCanvasPoints(projection, existingPlayer),
      3,
      18,
    );
    const slightMove = { x: rotationHandle.x + 3, y: rotationHandle.y - 2 };

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rotationHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: slightMove,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(
      (store.getState().board.objects.byId[existingPlayer.id] as PlayerObject)
        .rotation,
    ).toBeGreaterThan(20);
    expect(
      (store.getState().board.objects.byId[existingPlayer.id] as PlayerObject)
        .rotation,
    ).toBeLessThan(40);
  });

  it("resizes and rotates selected equipment using selection handles", () => {
    const equipmentTool = new EquipmentTool({
      definitions: [
        {
          kind: "goal",
          label: "Goal",
          defaultSize: { width: 6, height: 2 },
          color: "#ffffff",
          capabilities: { color: true },
          transformCapabilities: { resize: true, rotate: true },
          lockedAspectRatio: true,
        },
      ],
    });
    const existingEquipment = createEquipmentObject({
      id: "equipment-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 6, height: 2 },
      kind: "goal",
      color: "#ffffff",
      definition: {
        kind: "goal",
        label: "Goal",
        defaultSize: { width: 6, height: 2 },
        color: "#ffffff",
        capabilities: { color: true },
        transformCapabilities: { resize: true, rotate: true },
        lockedAspectRatio: true,
      },
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
          byId: {
            [existingEquipment.id]: existingEquipment,
          },
          order: [existingEquipment.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, equipmentTool],
    });
    const toolApi = createToolApi(store);
    equipmentTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingEquipment.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });

    const bottomRightHandle = projection.boardToCanvas({ x: 13, y: 11 });
    const nextBottomRightHandle = projection.boardToCanvas({ x: 16, y: 12 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: bottomRightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextBottomRightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(
      store.getState().board.objects.byId[existingEquipment.id],
    ).toMatchObject({
      size: { width: 12, height: 4 },
    });

    const resizedEquipment = store.getState().board.objects.byId[
      existingEquipment.id
    ] as typeof existingEquipment;
    const rotationHandle = getCornerHandleCanvasPoint(
      getEquipmentSelectionOutlineCanvasPoints(projection, resizedEquipment),
      3,
      18,
    );
    const rightOfCenter = projection.boardToCanvas({ x: 12, y: 10 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rotationHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: rightOfCenter,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(
      store.getState().board.objects.byId[existingEquipment.id]?.rotation,
    ).toBeCloseTo(213.6900675259797);
  });

  it("shows one group overlay and resizes a multi selection by redistributing object positions", () => {
    const playerTool = new PlayerTool();
    const firstPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 2.5, height: 2.5 },
      color: "#ffffff",
    });
    const secondPlayer = createPlayerObject({
      id: "player-2",
      position: { x: 20, y: 10 },
      rotation: 0,
      size: { width: 2.5, height: 2.5 },
      color: "#111827",
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
          byId: {
            [firstPlayer.id]: firstPlayer,
            [secondPlayer.id]: secondPlayer,
          },
          order: [firstPlayer.id, secondPlayer.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [firstPlayer.id, secondPlayer.id]);

    const overlays = selectTool.getOverlayItems(store.getState());
    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      kind: "select:group-selection-ring",
    });

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bounds = getMultiSelectionCanvasBounds(projection, [
      firstPlayer,
      secondPlayer,
    ]);
    const handlePoint = {
      x: bounds.right,
      y: (bounds.top + bounds.bottom) / 2,
    };
    const initialBoardBounds = {
      minX: projection.canvasToBoard({ x: bounds.left, y: bounds.top }).x,
      maxX: projection.canvasToBoard({ x: bounds.right, y: bounds.bottom }).x,
    };
    const nextMaxX = initialBoardBounds.maxX + 10;
    const intermediateMaxX = initialBoardBounds.maxX + 4;
    const intermediateDragPoint = {
      x: projection.boardToCanvas({ x: intermediateMaxX, y: 0 }).x,
      y: handlePoint.y,
    };
    const dragPoint = {
      x: projection.boardToCanvas({ x: nextMaxX, y: 0 }).x,
      y: handlePoint.y,
    };

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: handlePoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: intermediateDragPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: dragPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const resizedFirstPlayer = store.getState().board.objects.byId[
      firstPlayer.id
    ] as PlayerObject;
    const resizedSecondPlayer = store.getState().board.objects.byId[
      secondPlayer.id
    ] as PlayerObject;
    const remapX = (value: number) =>
      initialBoardBounds.minX +
      ((value - initialBoardBounds.minX) /
        (initialBoardBounds.maxX - initialBoardBounds.minX)) *
        (nextMaxX - initialBoardBounds.minX);

    expect(resizedFirstPlayer.position.x).toBeCloseTo(
      remapX(firstPlayer.position.x),
      6,
    );
    expect(resizedSecondPlayer.position.x).toBeCloseTo(
      remapX(secondPlayer.position.x),
      6,
    );
    expect(resizedFirstPlayer.size).toMatchObject(firstPlayer.size ?? {});
    expect(resizedSecondPlayer.size).toMatchObject(secondPlayer.size ?? {});
  });

  it("scales geometric objects but only repositions players during group resize", () => {
    const playerTool = new PlayerTool();
    const shapeTool = new ShapeTool();
    const arrowTool = new ArrowTool();
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 2.5, height: 2.5 },
      color: "#ffffff",
    });
    const shape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      start: { x: 20, y: 8 },
      end: { x: 30, y: 14 },
      color: "#111827",
      strokeWidth: 2,
      lineStyle: "solid",
      fillStyle: "none",
      bordered: true,
    });
    const arrow = createArrowObject({
      id: "arrow-1",
      start: { x: 34, y: 10 },
      end: { x: 44, y: 10 },
      color: "#111827",
      strokeWidth: 2,
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
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
          byId: {
            [player.id]: player,
            [shape.id]: shape,
            [arrow.id]: arrow,
          },
          order: [player.id, shape.id, arrow.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool, shapeTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    shapeTool.registerCapabilities?.(toolApi);
    arrowTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [player.id, shape.id, arrow.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bounds = getMixedSelectionCanvasBounds(projection, [
      player,
      shape,
      arrow,
    ]);
    const handlePoint = {
      x: bounds.right,
      y: (bounds.top + bounds.bottom) / 2,
    };
    const initialBoardBounds = {
      minX: projection.canvasToBoard({ x: bounds.left, y: bounds.top }).x,
      maxX: projection.canvasToBoard({ x: bounds.right, y: bounds.bottom }).x,
      minY: projection.canvasToBoard({ x: bounds.left, y: bounds.top }).y,
      maxY: projection.canvasToBoard({ x: bounds.right, y: bounds.bottom }).y,
    };
    const nextBoardBounds = {
      ...initialBoardBounds,
      maxX: initialBoardBounds.maxX + 12,
    };
    const dragPoint = {
      x: projection.boardToCanvas({ x: nextBoardBounds.maxX, y: 0 }).x,
      y: handlePoint.y,
    };
    const remapX = (value: number) =>
      initialBoardBounds.minX +
      ((value - initialBoardBounds.minX) /
        (initialBoardBounds.maxX - initialBoardBounds.minX)) *
        (nextBoardBounds.maxX - initialBoardBounds.minX);

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: handlePoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: dragPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const resizedPlayer = store.getState().board.objects.byId[
      player.id
    ] as PlayerObject;
    const resizedShape = store.getState().board.objects.byId[
      shape.id
    ] as ShapeObject;
    const resizedArrow = store.getState().board.objects.byId[
      arrow.id
    ] as ArrowObject;

    expect(resizedPlayer.position.x).toBeCloseTo(remapX(player.position.x), 6);
    expect(resizedPlayer.size).toMatchObject(player.size ?? {});
    expect(resizedShape.props.start?.x).toBeCloseTo(
      remapX(shape.props.start!.x),
      6,
    );
    expect(resizedShape.props.end?.x).toBeCloseTo(
      remapX(shape.props.end!.x),
      6,
    );
    expect(resizedShape.size?.width).toBeGreaterThan(shape.size?.width ?? 0);
    expect(resizedArrow.props.start.x).toBeCloseTo(
      remapX(arrow.props.start.x),
      6,
    );
    expect(resizedArrow.props.end.x).toBeCloseTo(remapX(arrow.props.end.x), 6);
    expect(resizedArrow.size?.width).toBeGreaterThan(arrow.size?.width ?? 0);
  });

  it("resizes a multi selection diagonally from a corner handle", () => {
    const playerTool = new PlayerTool();
    const firstPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 2.5, height: 2.5 },
      color: "#ffffff",
    });
    const secondPlayer = createPlayerObject({
      id: "player-2",
      position: { x: 20, y: 20 },
      rotation: 0,
      size: { width: 2.5, height: 2.5 },
      color: "#111827",
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
          byId: {
            [firstPlayer.id]: firstPlayer,
            [secondPlayer.id]: secondPlayer,
          },
          order: [firstPlayer.id, secondPlayer.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [firstPlayer.id, secondPlayer.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bounds = getMultiSelectionCanvasBounds(projection, [
      firstPlayer,
      secondPlayer,
    ]);
    const handlePoint = {
      x: bounds.right,
      y: bounds.bottom,
    };
    const initialBoardBounds = {
      minX: projection.canvasToBoard({ x: bounds.left, y: bounds.top }).x,
      maxX: projection.canvasToBoard({ x: bounds.right, y: bounds.bottom }).x,
      minY: projection.canvasToBoard({ x: bounds.left, y: bounds.top }).y,
      maxY: projection.canvasToBoard({ x: bounds.right, y: bounds.bottom }).y,
    };
    const nextBounds = {
      maxX: initialBoardBounds.maxX + 8,
      maxY: initialBoardBounds.maxY + 6,
    };
    const dragPoint = projection.boardToCanvas({
      x: nextBounds.maxX,
      y: nextBounds.maxY,
    });
    const remap = (
      value: number,
      fromMin: number,
      fromMax: number,
      toMin: number,
      toMax: number,
    ) => toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: handlePoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: dragPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const resizedFirstPlayer = store.getState().board.objects.byId[
      firstPlayer.id
    ] as PlayerObject;
    const resizedSecondPlayer = store.getState().board.objects.byId[
      secondPlayer.id
    ] as PlayerObject;

    expect(resizedFirstPlayer.position.x).toBeCloseTo(
      remap(
        firstPlayer.position.x,
        initialBoardBounds.minX,
        initialBoardBounds.maxX,
        initialBoardBounds.minX,
        nextBounds.maxX,
      ),
      6,
    );
    expect(resizedFirstPlayer.position.y).toBeCloseTo(
      remap(
        firstPlayer.position.y,
        initialBoardBounds.minY,
        initialBoardBounds.maxY,
        initialBoardBounds.minY,
        nextBounds.maxY,
      ),
      6,
    );
    expect(resizedSecondPlayer.position.x).toBeCloseTo(
      remap(
        secondPlayer.position.x,
        initialBoardBounds.minX,
        initialBoardBounds.maxX,
        initialBoardBounds.minX,
        nextBounds.maxX,
      ),
      6,
    );
    expect(resizedSecondPlayer.position.y).toBeCloseTo(
      remap(
        secondPlayer.position.y,
        initialBoardBounds.minY,
        initialBoardBounds.maxY,
        initialBoardBounds.minY,
        nextBounds.maxY,
      ),
      6,
    );
  });

  it("rotates a multi selection around the group center", () => {
    const playerTool = new PlayerTool();
    const baseFirstPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 2.5, height: 2.5 },
      color: "#ffffff",
    });
    const baseSecondPlayer = createPlayerObject({
      id: "player-2",
      position: { x: 20, y: 10 },
      rotation: 90,
      size: { width: 2.5, height: 2.5 },
      color: "#111827",
    });
    const firstPlayer = {
      ...baseFirstPlayer,
      props: {
        ...baseFirstPlayer.props,
        transformCapabilities: {
          ...baseFirstPlayer.props.transformCapabilities,
          rotate: true,
        },
      },
    };
    const secondPlayer = {
      ...baseSecondPlayer,
      props: {
        ...baseSecondPlayer.props,
        transformCapabilities: {
          ...baseSecondPlayer.props.transformCapabilities,
          rotate: true,
        },
      },
    };
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
            [firstPlayer.id]: firstPlayer,
            [secondPlayer.id]: secondPlayer,
          },
          order: [firstPlayer.id, secondPlayer.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [firstPlayer.id, secondPlayer.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bounds = getMultiSelectionCanvasBounds(projection, [
      firstPlayer,
      secondPlayer,
    ]);
    const center = projection.canvasToBoard({
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
    });
    const dx = bounds.right - bounds.left || 1;
    const dy = bounds.bottom - bounds.top || 1;
    const length = Math.hypot(dx, dy) || 1;
    const rotateHandle = {
      x: bounds.left - (dx / length) * 18,
      y: bounds.bottom + (dy / length) * 18,
    };
    const rotateTargetBoard = { x: center.x, y: center.y - 10 };
    const intermediateRotateTargetBoard = {
      x: center.x + 7,
      y: center.y - 7,
    };
    const intermediateRotateTarget = projection.boardToCanvas(
      intermediateRotateTargetBoard,
    );
    const rotateTarget = projection.boardToCanvas(rotateTargetBoard);
    const initialAngle = Math.atan2(
      projection.canvasToBoard(rotateHandle).y - center.y,
      projection.canvasToBoard(rotateHandle).x - center.x,
    );
    const nextAngle = Math.atan2(
      rotateTargetBoard.y - center.y,
      rotateTargetBoard.x - center.x,
    );
    const rotationDelta = ((nextAngle - initialAngle) * 180) / Math.PI;
    const rotateAround = (
      point: { x: number; y: number },
      pivot: { x: number; y: number },
      rotation: number,
    ) => {
      const angle = (rotation * Math.PI) / 180;
      const dx = point.x - pivot.x;
      const dy = point.y - pivot.y;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      return {
        x: pivot.x + dx * cos - dy * sin,
        y: pivot.y + dx * sin + dy * cos,
      };
    };

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rotateHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: intermediateRotateTarget,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    const rotatingOverlay = selectTool.getOverlayItems(store.getState())[0] as {
      kind: string;
      rotation?: number;
    };
    expect(rotatingOverlay.kind).toBe("select:group-selection-ring");
    expect(Math.abs(rotatingOverlay.rotation ?? 0)).toBeGreaterThan(0);
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: rotateTarget,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const rotatedFirstPlayer = store.getState().board.objects.byId[
      firstPlayer.id
    ] as PlayerObject;
    const rotatedSecondPlayer = store.getState().board.objects.byId[
      secondPlayer.id
    ] as PlayerObject;
    const expectedFirstPosition = rotateAround(
      firstPlayer.position,
      center,
      rotationDelta,
    );
    const expectedSecondPosition = rotateAround(
      secondPlayer.position,
      center,
      rotationDelta,
    );
    const normalizeRotation = (rotation: number) => {
      const normalized = rotation % 360;

      return normalized < 0 ? normalized + 360 : normalized;
    };

    expect(rotatedFirstPlayer.position.x).toBeCloseTo(
      expectedFirstPosition.x,
      6,
    );
    expect(rotatedFirstPlayer.position.y).toBeCloseTo(
      expectedFirstPosition.y,
      6,
    );
    expect(rotatedSecondPlayer.position.x).toBeCloseTo(
      expectedSecondPosition.x,
      6,
    );
    expect(rotatedSecondPlayer.position.y).toBeCloseTo(
      expectedSecondPosition.y,
      6,
    );
    expect(normalizeRotation(rotatedFirstPlayer.rotation ?? 0)).toBeCloseTo(
      normalizeRotation(rotationDelta),
      6,
    );
    expect(normalizeRotation(rotatedSecondPlayer.rotation ?? 0)).toBeCloseTo(
      normalizeRotation(90 + rotationDelta),
      6,
    );
  });

  it("hides group rotation when any selected object cannot rotate", () => {
    const playerTool = new PlayerTool();
    const baseFirstPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 2.5, height: 2.5 },
      color: "#ffffff",
    });
    const secondPlayer = createPlayerObject({
      id: "player-2",
      position: { x: 20, y: 10 },
      rotation: 90,
      size: { width: 2.5, height: 2.5 },
      color: "#111827",
    });
    const firstPlayer = {
      ...baseFirstPlayer,
      props: {
        ...baseFirstPlayer.props,
        transformCapabilities: {
          ...baseFirstPlayer.props.transformCapabilities,
          rotate: true,
        },
      },
    };
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
            [firstPlayer.id]: firstPlayer,
            [secondPlayer.id]: secondPlayer,
          },
          order: [firstPlayer.id, secondPlayer.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, playerTool],
    });
    const toolApi = createToolApi(store);
    playerTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [firstPlayer.id, secondPlayer.id]);

    const overlay = selectTool.getOverlayItems(store.getState())[0] as {
      kind: string;
      canRotate?: boolean;
      rotation?: number;
    };

    expect(overlay.kind).toBe("select:group-selection-ring");
    expect(overlay.canRotate).toBe(false);
    expect(overlay.rotation).toBeUndefined();

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bounds = getMultiSelectionCanvasBounds(projection, [
      firstPlayer,
      secondPlayer,
    ]);
    const dx = bounds.right - bounds.left || 1;
    const dy = bounds.bottom - bounds.top || 1;
    const length = Math.hypot(dx, dy) || 1;
    const rotateHandle = {
      x: bounds.left - (dx / length) * 18,
      y: bounds.bottom + (dy / length) * 18,
    };
    const initialFirstPlayer = store.getState().board.objects.byId[
      firstPlayer.id
    ] as PlayerObject;
    const initialSecondPlayer = store.getState().board.objects.byId[
      secondPlayer.id
    ] as PlayerObject;

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rotateHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: { x: rotateHandle.x + 24, y: rotateHandle.y - 24 },
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId[firstPlayer.id]).toMatchObject(
      initialFirstPlayer,
    );
    expect(store.getState().board.objects.byId[secondPlayer.id]).toMatchObject(
      initialSecondPlayer,
    );
  });

  it("rotates but does not resize ladder equipment", () => {
    const definition: EquipmentDefinition = {
      kind: "ladder",
      label: "Ladder",
      defaultSize: { width: 3.8, height: 14 },
      color: "#0f172a",
      capabilities: { color: true },
      transformCapabilities: { resize: false, rotate: true },
      lockedAspectRatio: true,
    };
    const equipmentTool = new EquipmentTool({
      definitions: [definition],
    });
    const existingEquipment = createEquipmentObject({
      id: "equipment-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 3.8, height: 14 },
      kind: definition.kind,
      color: definition.color,
      definition,
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
          byId: {
            [existingEquipment.id]: existingEquipment,
          },
          order: [existingEquipment.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, equipmentTool],
    });
    const toolApi = createToolApi(store);
    equipmentTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingEquipment.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });

    const cornerPoint = projection.boardToCanvas({ x: 11.9, y: 17 });
    const dragPoint = projection.boardToCanvas({ x: 13.9, y: 18 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: cornerPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: dragPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const resizedEquipment =
      store.getState().board.objects.byId[existingEquipment.id];
    expect(resizedEquipment?.position.x).toBeCloseTo(12);
    expect(resizedEquipment?.position.y).toBeCloseTo(11);
    expect(resizedEquipment).toMatchObject({
      size: { width: 3.8, height: 14 },
      rotation: 0,
    });

    const movedEquipment = store.getState().board.objects.byId[
      existingEquipment.id
    ] as typeof existingEquipment;
    const rotationHandle = getCornerHandleCanvasPoint(
      getEquipmentSelectionOutlineCanvasPoints(projection, movedEquipment),
      3,
      18,
    );
    const rotateTarget = projection.boardToCanvas({ x: 13, y: 10 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rotationHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: rotateTarget,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(
      (
        store.getState().board.objects.byId[existingEquipment.id] as {
          rotation?: number;
        }
      ).rotation,
    ).not.toBe(0);
  });

  it("moves a ball instead of resizing or rotating it", () => {
    const definition: EquipmentDefinition = {
      kind: "soccer-ball",
      label: "Ball",
      defaultSize: { width: 1.5, height: 1.5 },
      color: "#ffffff",
      transformCapabilities: { resize: false, rotate: false },
      lockedAspectRatio: true,
    };
    const equipmentTool = new EquipmentTool({
      definitions: [definition],
    });
    const existingEquipment = createEquipmentObject({
      id: "equipment-1",
      position: { x: 10, y: 10 },
      rotation: 0,
      size: { width: 1.5, height: 1.5 },
      kind: definition.kind,
      color: definition.color,
      definition,
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
          byId: {
            [existingEquipment.id]: existingEquipment,
          },
          order: [existingEquipment.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, equipmentTool],
    });
    const toolApi = createToolApi(store);
    equipmentTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingEquipment.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });

    const edgePoint = projection.boardToCanvas({ x: 10.75, y: 10.75 });
    const dragPoint = projection.boardToCanvas({ x: 12.75, y: 11.75 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: edgePoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: dragPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const movedEquipment =
      store.getState().board.objects.byId[existingEquipment.id];
    expect(movedEquipment?.position.x).toBeCloseTo(12);
    expect(movedEquipment?.position.y).toBeCloseTo(11);
    expect(movedEquipment).toMatchObject({
      size: { width: 1.5, height: 1.5 },
      rotation: 0,
    });
  });

  it("renders equipment through host app adapters keyed by kind", () => {
    const customRenderer = vi.fn();
    const equipmentTool = new EquipmentTool({
      definitions: [
        {
          kind: "football-cone",
          label: "Football Cone",
          defaultSize: { width: 1.8, height: 2.2 },
          color: "#ff6b35",
          lockedAspectRatio: true,
        },
      ],
      renderersByKind: {
        "football-cone": customRenderer,
      },
    });
    const equipment = createEquipmentObject({
      id: "equipment-1",
      position: { x: 10, y: 10 },
      size: { width: 1.8, height: 2.2 },
      kind: "football-cone",
      color: "#ff6b35",
      definition: {
        kind: "football-cone",
        label: "Football Cone",
        defaultSize: { width: 1.8, height: 2.2 },
        color: "#ff6b35",
        lockedAspectRatio: true,
      },
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
          byId: {
            [equipment.id]: equipment,
          },
          order: [equipment.id],
        },
        style: {},
      },
      initialToolId: equipmentTool.id,
      tools: [selectTool, equipmentTool],
    });
    const toolApi = createToolApi(store);
    equipmentTool.registerCapabilities?.(toolApi);

    const renderer = store.getState().rendering.objectRenderers[equipment.type];
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      arc: vi.fn(),
      roundRect: vi.fn(),
      strokeRect: vi.fn(),
      ellipse: vi.fn(),
      scale: vi.fn(),
      quadraticCurveTo: vi.fn(),
      drawImage: vi.fn(),
      globalAlpha: 1,
      strokeStyle: "",
      fillStyle: "",
      lineWidth: 0,
      lineCap: "butt",
      lineJoin: "miter",
    } as unknown as CanvasRenderingContext2D;

    renderer({
      context,
      object: equipment,
      appearance: "default",
      requestRender: vi.fn(),
      frameTransform: {
        getObjectCanvasBounds: () => ({
          x: 40,
          y: 30,
          width: 18,
          height: 22,
        }),
      } as never,
    });

    expect(customRenderer).toHaveBeenCalledTimes(1);
    expect(customRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        equipment,
        color: "#ff6b35",
        width: 18,
        height: 22,
      }),
    );
  });

  it("resizes a selected shape by dragging a corner handle", () => {
    const arrowTool = new ArrowTool();
    const shapeTool = new ShapeTool();
    const existingShape = createShapeObject({
      id: "shape-1",
      kind: "rectangle",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      color: "#fff",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
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
          byId: {
            [existingShape.id]: existingShape,
          },
          order: [existingShape.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingShape.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bottomRightHandle = projection.boardToCanvas({ x: 20, y: 18 });
    const nextBottomRightHandle = projection.boardToCanvas({ x: 30, y: 24 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: bottomRightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextBottomRightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId[existingShape.id]).toMatchObject(
      {
        props: {
          start: { x: 10, y: 10 },
          end: { x: 30, y: 24 },
        },
      },
    );
  });

  it("uses directional resize cursors for selected shape handles", () => {
    const shapeTool = new ShapeTool();
    const existingShape = createShapeObject({
      id: "shape-cursor-1",
      kind: "rectangle",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      color: "#fff",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
    });
    const { controller, projection } = createEditorHarness({
      initialToolId: SELECT_TOOL_ID,
      tools: [shapeTool],
      objects: [existingShape],
      selectedObjectIds: [existingShape.id],
    });
    const bottomRightHandle = getShapeSelectionOutlineCanvasPoints(
      projection,
      existingShape,
    )[2]!;

    expect(
      controller.getCursor({
        clientPoint: bottomRightHandle,
        pointerId: 1,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        canvasRect,
      }),
    ).toBe("nwse-resize");
  });

  it("does not use resize cursors for selected arrow endpoints", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-cursor-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
    });
    const { controller, boardToCanvas } = createEditorHarness({
      initialToolId: SELECT_TOOL_ID,
      tools: [arrowTool],
      objects: [existingArrow],
      selectedObjectIds: [existingArrow.id],
    });

    expect(
      controller.getCursor({
        clientPoint: boardToCanvas(existingArrow.props.end),
        pointerId: 1,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        canvasRect,
      }),
    ).toBeUndefined();
  });

  it("rotates a selected shape using the rotate handle", () => {
    const arrowTool = new ArrowTool();
    const shapeTool = new ShapeTool();
    const existingShape = createShapeObject({
      id: "shape-rotate-1",
      kind: "rectangle",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      color: "#fff",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
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
          byId: {
            [existingShape.id]: existingShape,
          },
          order: [existingShape.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingShape.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const center = { x: 15, y: 14 };
    const centerCanvas = projection.boardToCanvas(center);
    const bottomLeftCanvas = projection.boardToCanvas({ x: 10, y: 18 });
    const dx = bottomLeftCanvas.x - centerCanvas.x;
    const dy = bottomLeftCanvas.y - centerCanvas.y;
    const length = Math.hypot(dx, dy);
    const rotationHandle = {
      x: bottomLeftCanvas.x + (dx / length) * 18,
      y: bottomLeftCanvas.y + (dy / length) * 18,
    };
    const handleBoard = projection.canvasToBoard(rotationHandle);
    const targetBoard = { x: 25, y: 14 };
    const targetCanvas = projection.boardToCanvas(targetBoard);

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rotationHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: targetCanvas,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const expectedRotation =
      (((((Math.atan2(targetBoard.y - center.y, targetBoard.x - center.x) -
        Math.atan2(handleBoard.y - center.y, handleBoard.x - center.x)) *
        180) /
        Math.PI) %
        360) +
        360) %
      360;

    expect(store.getState().board.objects.byId[existingShape.id]).toMatchObject(
      {
        rotation: expectedRotation,
      },
    );
  });

  it("keeps the opposite corner fixed when resizing a rotated shape", () => {
    const arrowTool = new ArrowTool();
    const shapeTool = new ShapeTool();
    const existingShape = createShapeObject({
      id: "shape-rotate-resize-1",
      kind: "rectangle",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 18 },
      rotation: 45,
      color: "#fff",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: false,
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
          byId: {
            [existingShape.id]: existingShape,
          },
          order: [existingShape.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingShape.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const initialCorners = getRotatedRectBoardPoints({
      center: existingShape.position,
      width: existingShape.size?.width ?? 0,
      height: existingShape.size?.height ?? 0,
      rotation: existingShape.rotation,
    });
    const fixedTopLeft = initialCorners[0];
    const initialBottomRight = initialCorners[2];
    const nextWidth = 20;
    const nextHeight = 14;
    const nextCenter = {
      x:
        fixedTopLeft.x -
        rotateOffset(-nextWidth / 2, -nextHeight / 2, existingShape.rotation).x,
      y:
        fixedTopLeft.y -
        rotateOffset(-nextWidth / 2, -nextHeight / 2, existingShape.rotation).y,
    };
    const targetBottomRight = {
      x:
        nextCenter.x +
        rotateOffset(nextWidth / 2, nextHeight / 2, existingShape.rotation).x,
      y:
        nextCenter.y +
        rotateOffset(nextWidth / 2, nextHeight / 2, existingShape.rotation).y,
    };

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: projection.boardToCanvas(initialBottomRight),
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: projection.boardToCanvas(targetBottomRight),
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const resizedShape = store.getState().board.objects.byId[
      existingShape.id
    ] as ShapeObject;
    const resizedCorners = getRotatedRectBoardPoints({
      center: resizedShape.position,
      width: resizedShape.size?.width ?? 0,
      height: resizedShape.size?.height ?? 0,
      rotation: resizedShape.rotation,
    });

    expect(resizedCorners[0].x).toBeCloseTo(fixedTopLeft.x, 6);
    expect(resizedCorners[0].y).toBeCloseTo(fixedTopLeft.y, 6);
    expect(resizedCorners[2].x).toBeCloseTo(targetBottomRight.x, 6);
    expect(resizedCorners[2].y).toBeCloseTo(targetBottomRight.y, 6);
  });

  it("shows a shape ghost preview at the pointer before placement", () => {
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
      initialToolId: shapeTool.id,
      tools: [selectTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const previewPoint = projection.boardToCanvas({ x: 24, y: 18 });

    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: previewPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().rendering.previewObjects).toHaveLength(1);
    expect(store.getState().rendering.previewObjects[0]).toMatchObject({
      id: "shape-preview",
      type: "shape",
      position: { x: 32, y: 24 },
      props: {
        kind: "rectangle",
        start: { x: 24, y: 18 },
        end: { x: 40, y: 30 },
      },
    });
  });

  it("creates a rectangle shape with the default preview size on click", () => {
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
      initialToolId: shapeTool.id,
      tools: [selectTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const clickPoint = projection.boardToCanvas({ x: 24, y: 18 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: clickPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerUp", {
      clientPoint: clickPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual(["shape-1"]);
    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().board.objects.byId["shape-1"]).toMatchObject({
      type: "shape",
      position: { x: 32, y: 24 },
      props: {
        kind: "rectangle",
        start: { x: 24, y: 18 },
        end: { x: 40, y: 30 },
      },
    });
  });

  it("lets consumers configure the shape click-preview size", () => {
    const shapeTool = new ShapeTool({
      defaultPreviewSize: {
        width: 128,
        height: 96,
      },
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        frame: {
          width: 920,
          height: 592,
        },
        objects: {
          byId: {},
          order: [],
        },
        style: {},
      },
      initialToolId: shapeTool.id,
      tools: [selectTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 700,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const clickPoint = projection.boardToCanvas({ x: 80, y: 64 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: clickPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerUp", {
      clientPoint: clickPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId["shape-1"]).toMatchObject({
      type: "shape",
      position: { x: 144, y: 112 },
      props: {
        kind: "rectangle",
        start: { x: 80, y: 64 },
        end: { x: 208, y: 160 },
      },
    });
  });

  it("creates a simple arrow by dragging and releasing after the first click", () => {
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
      initialToolId: arrowTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerCapabilities?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const startPoint = projection.boardToCanvas({ x: 10, y: 10 });
    const endPoint = projection.boardToCanvas({ x: 24, y: 18 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: startPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: endPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerUp", {
      clientPoint: endPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual(["arrow-1"]);
    expect(getArrowToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().board.objects.byId["arrow-1"]).toMatchObject({
      type: "arrow",
      props: {
        start: { x: 10, y: 10 },
        end: { x: 24, y: 18 },
      },
    });
  });

  it("creates a rectangle shape by dragging and releasing after the first click", () => {
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
      initialToolId: shapeTool.id,
      tools: [selectTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const startPoint = projection.boardToCanvas({ x: 10, y: 10 });
    const endPoint = projection.boardToCanvas({ x: 24, y: 18 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: startPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: endPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerUp", {
      clientPoint: endPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual(["shape-1"]);
    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().board.objects.byId["shape-1"]).toMatchObject({
      type: "shape",
      props: {
        kind: "rectangle",
        start: { x: 10, y: 10 },
        end: { x: 24, y: 18 },
      },
    });
  });

  it("creates a polygon shape when clicking back near the first vertex", () => {
    const shapeTool = new ShapeTool({
      defaults: [
        {
          id: "polygon",
          label: "Polygon",
          draftStyle: {
            kind: "polygon",
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
      initialToolId: shapeTool.id,
      tools: [selectTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);
    shapeTool.onActivate?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const firstPoint = projection.boardToCanvas({ x: 10, y: 10 });
    const secondPoint = projection.boardToCanvas({ x: 18, y: 16 });
    const thirdPoint = projection.boardToCanvas({ x: 14, y: 24 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: firstPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: secondPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    const closePoint = {
      x: firstPoint.x + 6,
      y: firstPoint.y + 4,
    };

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: thirdPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [
        { x: 10, y: 10 },
        { x: 18, y: 16 },
        { x: 14, y: 24 },
      ],
    );

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: closePoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual(["shape-1"]);
    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().board.objects.byId["shape-1"]).toMatchObject({
      type: "shape",
      props: {
        kind: "polygon",
        points: [
          { x: 10, y: 10 },
          { x: 18, y: 16 },
          { x: 14, y: 24 },
        ],
      },
    });
  });

  it("creates a polygon shape when right-clicking to finish", () => {
    const shapeTool = new ShapeTool({
      defaults: [
        {
          id: "polygon",
          label: "Polygon",
          draftStyle: {
            kind: "polygon",
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
      initialToolId: shapeTool.id,
      tools: [selectTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    shapeTool.registerCapabilities?.(toolApi);
    shapeTool.onActivate?.(toolApi);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const firstPoint = projection.boardToCanvas({ x: 10, y: 10 });
    const secondPoint = projection.boardToCanvas({ x: 18, y: 16 });
    const thirdPoint = projection.boardToCanvas({ x: 14, y: 24 });
    const finishPoint = projection.boardToCanvas({ x: 22, y: 18 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: firstPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: secondPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: thirdPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: finishPoint,
      pointerId: 1,
      button: 2,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual(["shape-1"]);
    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [],
    );
    expect(store.getState().board.objects.byId["shape-1"]).toMatchObject({
      type: "shape",
      props: {
        kind: "polygon",
        points: [
          { x: 10, y: 10 },
          { x: 18, y: 16 },
          { x: 14, y: 24 },
        ],
      },
    });
  });

  it("resizes a selected polygon in step with the dragged corner handle", () => {
    const shapeTool = new ShapeTool();
    const polygon = createShapeObject({
      id: "polygon-1",
      kind: "polygon",
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
        { x: 10, y: 20 },
      ],
      color: "#fff",
      lineStyle: "solid",
      fillStyle: "solid",
      bordered: true,
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
          byId: {
            [polygon.id]: polygon,
          },
          order: [polygon.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, shapeTool],
    });
    const toolApi = createToolApi(store);
    setSelectedObjectIds(toolApi, [polygon.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bottomRightHandle = projection.boardToCanvas({ x: 20.08, y: 20.08 });
    const nextBottomRightHandle = projection.boardToCanvas({
      x: 22.08,
      y: 22.08,
    });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: bottomRightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextBottomRightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(
      (store.getState().board.objects.byId[polygon.id] as ShapeObject).props
        .points,
    ).toEqual([
      { x: 10, y: 10 },
      { x: 22, y: 10 },
      { x: 22, y: 22 },
      { x: 10, y: 22 },
    ]);
  });

  it("moves a selected arrow when dragging the arrow body", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 40, y: 10 },
      color: "#fff",
      strokeWidth: 0.225,
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
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
          byId: {
            [existingArrow.id]: existingArrow,
          },
          order: [existingArrow.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingArrow.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bodyPoint = projection.boardToCanvas({ x: 25, y: 10 });
    const middleBodyPoint = projection.boardToCanvas({ x: 26, y: 12 });
    const nextBodyPoint = projection.boardToCanvas({ x: 28, y: 14 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: bodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: middleBodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextBodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerUp", {
      clientPoint: nextBodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 13, y: 14 },
          end: { x: 43, y: 14 },
        },
      },
    );
    expect(store.getState().history.past).toHaveLength(1);

    store.getState().actions.undo();

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 10, y: 10 },
          end: { x: 40, y: 10 },
        },
      },
    );
  });

  it("closes an in-flight drag batch when switching tools", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#fff",
      strokeWidth: 0.225,
      lineStyle: "solid",
      kind: "straight",
      startHead: "none",
      endHead: "triangle",
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
          byId: {
            [existingArrow.id]: existingArrow,
          },
          order: [existingArrow.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [
        selectTool,
        arrowTool,
        {
          id: "draw",
          label: "Draw",
        },
      ],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingArrow.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bodyPoint = projection.boardToCanvas({ x: 15, y: 10 });
    const nextBodyPoint = projection.boardToCanvas({ x: 18, y: 14 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: bodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextBodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    store.getState().actions.setActiveTool("draw");
    store.getState().actions.addObjects([
      {
        id: "token-2",
        type: "token",
        position: { x: 40, y: 20 },
        props: {},
      },
    ]);

    expect(store.getState().history.past).toHaveLength(2);

    store.getState().actions.undo();

    expect(store.getState().board.objects.byId["token-2"]).toBeUndefined();
    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 13, y: 14 },
          end: { x: 23, y: 14 },
        },
      },
    );

    store.getState().actions.undo();

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 10, y: 10 },
          end: { x: 20, y: 10 },
        },
      },
    );
  });

  it("pans vertically on wheel regardless of the active tool", () => {
    const playerTool = new PlayerTool();
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
      initialToolId: playerTool.id,
      tools: [selectTool, playerTool],
    });
    const controller = createBoardEditorController(store);
    const handled = controller.dispatchWheelEvent({
      clientPoint: { x: 100, y: 100 },
      deltaX: 0,
      deltaY: 24,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect: {
        left: 0,
        top: 0,
        width: 1000,
        height: 500,
      },
    });

    expect(handled).toBe(true);
    expect(store.getState().ui.viewport.pan).toEqual({
      x: 0,
      y: -24,
    });
  });

  it("pans horizontally on shift + wheel regardless of the active tool", () => {
    const playerTool = new PlayerTool();
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
      initialToolId: playerTool.id,
      tools: [selectTool, playerTool],
    });
    const controller = createBoardEditorController(store);
    const handled = controller.dispatchWheelEvent({
      clientPoint: { x: 100, y: 100 },
      deltaX: 0,
      deltaY: 24,
      ctrlKey: false,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      canvasRect: {
        left: 0,
        top: 0,
        width: 1000,
        height: 500,
      },
    });

    expect(handled).toBe(true);
    expect(store.getState().ui.viewport.pan).toEqual({
      x: -24,
      y: 0,
    });
  });

  it("zooms around the cursor on modifier + wheel", () => {
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
      tools: [selectTool],
    });
    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const beforeProjection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const boardPoint = beforeProjection.canvasToBoard({ x: 300, y: 200 });
    const handled = controller.dispatchWheelEvent({
      clientPoint: { x: 300, y: 200 },
      deltaX: 0,
      deltaY: -120,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(handled).toBe(true);
    expect(store.getState().ui.viewport.zoom).toBeGreaterThan(1);

    const afterProjection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });

    expect(afterProjection.boardToCanvas(boardPoint).x).toBeCloseTo(300);
    expect(afterProjection.boardToCanvas(boardPoint).y).toBeCloseTo(200);
  });

  it("zooms around the gesture center", () => {
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
      tools: [selectTool],
    });
    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const beforeProjection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const boardPoint = beforeProjection.canvasToBoard({ x: 300, y: 200 });
    const handled = controller.dispatchZoomEvent({
      clientPoint: { x: 300, y: 200 },
      scale: 1.5,
      canvasRect,
    });

    expect(handled).toBe(true);
    expect(store.getState().ui.viewport.zoom).toBeCloseTo(1.5);

    const afterProjection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });

    expect(afterProjection.boardToCanvas(boardPoint).x).toBeCloseTo(300);
    expect(afterProjection.boardToCanvas(boardPoint).y).toBeCloseTo(200);
  });

  it("clamps modifier + wheel zoom", () => {
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
      tools: [selectTool],
    });
    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };

    controller.dispatchWheelEvent({
      clientPoint: { x: 500, y: 250 },
      deltaX: 0,
      deltaY: 10000,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    expect(store.getState().ui.viewport.zoom).toBe(MIN_VIEWPORT_ZOOM);

    controller.dispatchWheelEvent({
      clientPoint: { x: 500, y: 250 },
      deltaX: 0,
      deltaY: -10000,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    expect(store.getState().ui.viewport.zoom).toBe(MAX_VIEWPORT_ZOOM);
  });

  it("allows contained modifier + wheel zoom to reach fit", () => {
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
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool],
      navigationMode: "contained",
    });
    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 500,
      height: 400,
    };

    store.getState().actions.setCanvasRect(canvasRect);
    controller.dispatchWheelEvent({
      clientPoint: { x: 310, y: 200 },
      deltaX: 0,
      deltaY: 10000,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().ui.viewport).toEqual({
      pan: { x: 0, y: 0 },
      zoom: 0.5,
    });
  });

  it("preserves a selected curved arrow's bend when dragging the arrow body", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 40, y: 10 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      kind: "curved",
      startHead: "none",
      endHead: "triangle",
    });
    const initialCurveOffset = existingArrow.props.curveOffset;
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
            [existingArrow.id]: existingArrow,
          },
          order: [existingArrow.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingArrow.id]);
    store.getState().actions.setViewport({
      pan: { x: 0, y: 0 },
      zoom: 4,
    });

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const bodyPoint = projection.boardToCanvas({ x: 20, y: 11 });
    const nextBodyPoint = projection.boardToCanvas({ x: 23, y: 15 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: bodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextBodyPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 13, y: 14 },
          end: { x: 43, y: 14 },
          curveOffset: initialCurveOffset,
        },
      },
    );
  });

  it("adjusts a selected curved arrow by dragging its curve handle", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      kind: "curved",
      startHead: "none",
      endHead: "triangle",
    });
    const initialHandlePoint = getArrowCurveHandlePoint(
      existingArrow.props.start,
      existingArrow.props.end,
      existingArrow.props.curveOffset,
    );
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
            [existingArrow.id]: existingArrow,
          },
          order: [existingArrow.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingArrow.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const controlPoint = projection.boardToCanvas(initialHandlePoint);
    const nextControlPoint = projection.boardToCanvas({ x: 15, y: 5 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: controlPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextControlPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          curveOffset: -9,
        },
      },
    );
  });

  it("adjusts a selected curved arrow when dragging near its curve handle", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      kind: "curved",
      startHead: "none",
      endHead: "triangle",
    });
    const initialHandlePoint = getArrowCurveHandlePoint(
      existingArrow.props.start,
      existingArrow.props.end,
      existingArrow.props.curveOffset,
    );
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
            [existingArrow.id]: existingArrow,
          },
          order: [existingArrow.id],
        },
        style: {},
      },
      initialToolId: SELECT_TOOL_ID,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerCapabilities?.(toolApi);
    setSelectedObjectIds(toolApi, [existingArrow.id]);

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      frame: store.getState().board.frame,
      viewport: store.getState().ui.viewport,
      canvasRect,
    });
    const controlPoint = projection.boardToCanvas(initialHandlePoint);
    const nearControlPoint = {
      x: controlPoint.x,
      y: controlPoint.y + 8,
    };
    const nextControlPoint = projection.boardToCanvas({ x: 15, y: 5 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: nearControlPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextControlPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.byId[existingArrow.id]).toMatchObject(
      {
        props: {
          start: { x: 10, y: 10 },
          end: { x: 20, y: 10 },
          curveOffset: -9,
        },
      },
    );
  });
});
