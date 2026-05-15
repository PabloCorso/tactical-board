import { describe, expect, it, vi } from "vitest";
import { createBoardEditorController } from "./board-editor-controller";
import { createToolApi } from "./create-tool-api";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import { createBoardEditorStore } from "../store/board-editor-store";
import {
  createArrowObject,
  getArrowCurveHandlePoint,
} from "../objects/arrow-object";
import {
  createEquipmentObject,
  type EquipmentDefinition,
} from "../objects/equipment-object";
import {
  createPlayerObject,
  type PlayerObject,
} from "../objects/player-object";
import { createShapeObject, type ShapeObject } from "../objects/shape-object";
import { ArrowTool } from "../../tools/arrow-tool";
import { EquipmentTool } from "../../tools/equipment-tool";
import { PlayerTool } from "../../tools/player-tool";
import { ShapeTool } from "../../tools/shape-tool";
import { SelectTool } from "../../tools/select-tool";
import { setSelectedObjectIds } from "../../tools/select-tool-actions";
import { ARROW_TOOL_ID, getArrowToolState } from "../../tools/arrow-tool-state";
import {
  getPlayerToolState,
  PLAYER_TOOL_ID,
} from "../../tools/player-tool-state";
import {
  getSelectToolState,
  SELECT_TOOL_ID,
} from "../../tools/select-tool-state";
import { getShapeToolState } from "../../tools/shape-tool-state";
import { FOOTBALL_PLAYER_PRESET_COLORS } from "../../examples/football/football-example-catalog";
import { MAX_VIEWPORT_ZOOM, MIN_VIEWPORT_ZOOM } from "./viewport-utils";

describe("createBoardEditorController", () => {
  const selectTool = new SelectTool();
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
  const setArrowDraftStyle = (
    toolApi: ReturnType<typeof createToolApi>,
    draftStyle: Partial<ReturnType<typeof getArrowToolState>["draftStyle"]>,
  ) => {
    const arrowState = getArrowToolState(toolApi.getState().toolState);
    toolApi.setToolState(ARROW_TOOL_ID, {
      ...arrowState,
      draftStyle: {
        ...arrowState.draftStyle,
        ...draftStyle,
      },
    });
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
      bodyStyle: "straight",
      startHead: "none",
      endHead: "triangle",
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
          byId: {
            [existingArrow.id]: existingArrow,
          },
          order: [existingArrow.id],
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const startPoint = projection.worldToCanvas(existingArrow.props.start);
    const endPoint = projection.worldToCanvas({ x: 30, y: 15 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: {
        x: startPoint.x + canvasRect.left,
        y: startPoint.y + canvasRect.top,
      },
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual([]);
    expect(getArrowToolState(store.getState().toolState).pendingPoints).toEqual(
      [
        {
          x: 10,
          y: 10,
        },
      ],
    );

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: {
        x: endPoint.x + canvasRect.left,
        y: endPoint.y + canvasRect.top,
      },
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual([
      "arrow-1",
      "arrow-2",
    ]);
    expect(
      getSelectToolState(store.getState().toolState).selectedObjectIds,
    ).toEqual([]);
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
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const previewPoint = projection.worldToCanvas({ x: 25, y: 12 });

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
      id: "player-preview",
      type: "player",
      position: { x: 25, y: 12 },
    });
  });

  it("shows an equipment ghost preview at the pointer before placement", () => {
    const equipmentTool = new EquipmentTool({
      definitions: [
        {
          kind: "football-cone",
          label: "Football Cone",
          family: "cone",
          defaultSize: { width: 1.8, height: 2.2 },
          color: "#ff6b35",
          lockedAspectRatio: true,
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
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const previewPoint = projection.worldToCanvas({ x: 32, y: 18 });

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
      bodyStyle: "straight",
      startHead: "none",
      endHead: "triangle",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const endPoint = projection.worldToCanvas(existingArrow.props.end);
    const nextEndPoint = projection.worldToCanvas({ x: 35, y: 18 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: endPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextEndPoint,
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
          end: { x: 35, y: 18 },
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const rightHandle = projection.worldToCanvas({ x: 20, y: 14 });
    const nextRightHandle = projection.worldToCanvas({ x: 30, y: 14 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: rightHandle,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextRightHandle,
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
          end: { x: 30, y: 18 },
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
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });

    const firstBlue = projection.worldToCanvas({ x: 10, y: 10 });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: firstBlue,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    const secondBlue = projection.worldToCanvas({ x: 20, y: 10 });
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
    const firstOrange = projection.worldToCanvas({ x: 30, y: 10 });
    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: firstOrange,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    setPlayerDraftStyle(toolApi, { color: "#111827" });
    const firstBlack = projection.worldToCanvas({ x: 40, y: 10 });
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
    const secondOrange = projection.worldToCanvas({ x: 50, y: 10 });
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
      props: { label: "1", color: "#111827" },
    });
    expect(store.getState().board.objects.byId["player-2"]).toMatchObject({
      type: "player",
      props: { label: "2", color: "#111827" },
    });
    expect(store.getState().board.objects.byId["player-3"]).toMatchObject({
      type: "player",
      props: { label: "1", color: "#ff6b35" },
    });
    expect(store.getState().board.objects.byId["player-4"]).toMatchObject({
      type: "player",
      props: { label: "3", color: "#111827" },
    });
    expect(store.getState().board.objects.byId["player-5"]).toMatchObject({
      type: "player",
      props: { label: "2", color: "#ff6b35" },
    });
    expect(
      getPlayerToolState(store.getState().toolState).nextNumericLabelByColor,
    ).toEqual({
      "#111827": 4,
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
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const nextBlue = projection.worldToCanvas({ x: 20, y: 10 });

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
      presets: FOOTBALL_PLAYER_PRESET_COLORS.slice(0, 6).map(
        (color, index) => ({
          id: `team-color-${index + 1}`,
          label: String(index + 1),
          draftStyle: { color },
        }),
      ),
    });
    const existingPlayers = FOOTBALL_PLAYER_PRESET_COLORS.slice(0, 6).map(
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
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
        family: "cone",
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
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const point = projection.worldToCanvas({ x: 16, y: 12 });

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
        definition: {
          family: "cone",
          lockedAspectRatio: true,
        },
      },
    });
  });

  it("moves a selected player instead of resizing when dragging a corner", () => {
    const playerTool = new PlayerTool();
    const existingPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      size: { width: 2, height: 2, mode: "world", unit: "m" },
      color: "#1f6feb",
      label: "1",
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });

    const bottomRightHandle = projection.worldToCanvas({ x: 11, y: 11 });
    const nextSizeHandle = projection.worldToCanvas({ x: 12, y: 12 });

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

    expect(
      store.getState().board.objects.byId[existingPlayer.id],
    ).toMatchObject({
      position: { x: 11, y: 11 },
      size: { width: 2, height: 2 },
    });
  });

  it("rotates a selected player by dragging the rotation handle", () => {
    const playerTool = new PlayerTool();
    const existingPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      size: { width: 2, height: 2, mode: "world", unit: "m" },
      color: "#1f6feb",
      label: "1",
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const rotationHandle = projection.worldToCanvas({ x: 7.4, y: 12.6 });
    const rightOfCenter = projection.worldToCanvas({ x: 12, y: 10 });

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
      store.getState().board.objects.byId[existingPlayer.id],
    ).toMatchObject({
      rotation: 225,
    });
  });

  it("does not snap a selected player rotation on the initial drag", () => {
    const playerTool = new PlayerTool();
    const existingPlayer = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      rotation: 30,
      size: { width: 2.5, height: 2.5, mode: "world", unit: "m" },
      color: "#111827",
      label: "1",
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const rotationHandle = projection.worldToCanvas({ x: 7.4, y: 12.6 });
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
          family: "frame",
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
      size: { width: 6, height: 2, mode: "world", unit: "m" },
      kind: "goal",
      color: "#ffffff",
      definition: {
        kind: "goal",
        label: "Goal",
        family: "frame",
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
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });

    const bottomRightHandle = projection.worldToCanvas({ x: 13, y: 11 });
    const nextBottomRightHandle = projection.worldToCanvas({ x: 16, y: 12 });

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

    const rotationHandle = projection.worldToCanvas({ x: 2.2, y: 12.6 });
    const rightOfCenter = projection.worldToCanvas({ x: 12, y: 10 });

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
      store.getState().board.objects.byId[existingEquipment.id],
    ).toMatchObject({
      rotation: 198.43494882292202,
    });
  });

  it("rotates but does not resize ladder equipment", () => {
    const definition: EquipmentDefinition = {
      kind: "ladder",
      label: "Ladder",
      family: "ladder",
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
      size: { width: 3.8, height: 14, mode: "world", unit: "m" },
      kind: definition.kind,
      color: definition.color,
      definition,
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });

    const cornerPoint = projection.worldToCanvas({ x: 11.9, y: 17 });
    const dragPoint = projection.worldToCanvas({ x: 13.9, y: 18 });

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

    expect(
      store.getState().board.objects.byId[existingEquipment.id],
    ).toMatchObject({
      position: { x: 12, y: 11 },
      size: { width: 3.8, height: 14 },
      rotation: 0,
    });

    const rotationHandle = projection.worldToCanvas({ x: 5.6, y: 18.4 });
    const rotateTarget = projection.worldToCanvas({ x: 13, y: 10 });

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
      family: "ball",
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
      size: { width: 1.5, height: 1.5, mode: "world", unit: "m" },
      kind: definition.kind,
      color: definition.color,
      definition,
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });

    const edgePoint = projection.worldToCanvas({ x: 10.75, y: 10.75 });
    const dragPoint = projection.worldToCanvas({ x: 12.75, y: 11.75 });

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

    expect(
      store.getState().board.objects.byId[existingEquipment.id],
    ).toMatchObject({
      position: { x: 12, y: 11 },
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
          family: "training-marker",
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
      size: { width: 1.8, height: 2.2, mode: "world", unit: "m" },
      kind: "football-cone",
      color: "#ff6b35",
      definition: {
        kind: "football-cone",
        label: "Football Cone",
        family: "training-marker",
        color: "#ff6b35",
        lockedAspectRatio: true,
      },
    });
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surfaceTransform: {
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
        surface: {
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const bottomRightHandle = projection.worldToCanvas({ x: 20, y: 18 });
    const nextBottomRightHandle = projection.worldToCanvas({ x: 30, y: 24 });

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
        surface: {
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const center = { x: 15, y: 14 };
    const centerCanvas = projection.worldToCanvas(center);
    const bottomLeftCanvas = projection.worldToCanvas({ x: 10, y: 18 });
    const dx = bottomLeftCanvas.x - centerCanvas.x;
    const dy = bottomLeftCanvas.y - centerCanvas.y;
    const length = Math.hypot(dx, dy);
    const rotationHandle = {
      x: bottomLeftCanvas.x + (dx / length) * 18,
      y: bottomLeftCanvas.y + (dy / length) * 18,
    };
    const handleWorld = projection.canvasToWorld(rotationHandle);
    const targetWorld = { x: 25, y: 14 };
    const targetCanvas = projection.worldToCanvas(targetWorld);

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
      (((((Math.atan2(targetWorld.y - center.y, targetWorld.x - center.x) -
        Math.atan2(handleWorld.y - center.y, handleWorld.x - center.x)) *
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

  it("creates a polyline arrow across multiple clicks", () => {
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
      initialToolId: arrowTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerCapabilities?.(toolApi);
    setArrowDraftStyle(toolApi, {
      geometry: "polyline",
      bodyStyle: "straight",
    });

    const controller = createBoardEditorController(store);
    const canvasRect = {
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    };
    const projection = createBoardSpaceProjection({
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const firstPoint = projection.worldToCanvas({ x: 10, y: 10 });
    const secondPoint = projection.worldToCanvas({ x: 15, y: 15 });
    const thirdPoint = projection.worldToCanvas({ x: 20, y: 10 });

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
      clientPoint: thirdPoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });

    expect(store.getState().board.objects.order).toEqual(["arrow-1"]);
    expect(store.getState().board.objects.byId["arrow-1"]).toMatchObject({
      type: "arrow",
      props: {
        geometry: "polyline",
        start: { x: 10, y: 10 },
        end: { x: 20, y: 10 },
        points: [
          { x: 10, y: 10 },
          { x: 15, y: 15 },
          { x: 20, y: 10 },
        ],
      },
    });
  });

  it("shows a shape ghost preview at the pointer before placement", () => {
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const previewPoint = projection.worldToCanvas({ x: 24, y: 18 });

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
      position: { x: 28, y: 21 },
      props: {
        kind: "rectangle",
        start: { x: 24, y: 18 },
        end: { x: 32, y: 24 },
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const clickPoint = projection.worldToCanvas({ x: 24, y: 18 });

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
      position: { x: 28, y: 21 },
      props: {
        kind: "rectangle",
        start: { x: 24, y: 18 },
        end: { x: 32, y: 24 },
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const startPoint = projection.worldToCanvas({ x: 10, y: 10 });
    const endPoint = projection.worldToCanvas({ x: 24, y: 18 });

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
        geometry: "simple",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const startPoint = projection.worldToCanvas({ x: 10, y: 10 });
    const endPoint = projection.worldToCanvas({ x: 24, y: 18 });

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

  it("creates a polygon shape across multiple clicks", () => {
    const shapeTool = new ShapeTool({
      presets: [
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const firstPoint = projection.worldToCanvas({ x: 10, y: 10 });
    const secondPoint = projection.worldToCanvas({ x: 18, y: 16 });
    const thirdPoint = projection.worldToCanvas({ x: 14, y: 24 });

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

    expect(getShapeToolState(store.getState().toolState).pendingPoints).toEqual(
      [
        { x: 10, y: 10 },
        { x: 18, y: 16 },
        { x: 14, y: 24 },
      ],
    );

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: thirdPoint,
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
        surface: {
          width: 100,
          height: 50,
          unit: "m",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const bottomRightHandle = projection.worldToCanvas({ x: 20.08, y: 20.08 });
    const nextBottomRightHandle = projection.worldToCanvas({
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
      end: { x: 20, y: 10 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      bodyStyle: "straight",
      startHead: "none",
      endHead: "triangle",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const bodyPoint = projection.worldToCanvas({ x: 15, y: 10 });
    const nextBodyPoint = projection.worldToCanvas({ x: 18, y: 14 });

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
          end: { x: 23, y: 14 },
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const worldPoint = beforeProjection.canvasToWorld({ x: 300, y: 200 });
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });

    expect(afterProjection.worldToCanvas(worldPoint).x).toBeCloseTo(300);
    expect(afterProjection.worldToCanvas(worldPoint).y).toBeCloseTo(200);
  });

  it("clamps modifier + wheel zoom", () => {
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

  it("preserves a selected curved arrow's bend when dragging the arrow body", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      start: { x: 10, y: 10 },
      end: { x: 20, y: 10 },
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      bodyStyle: "curved",
      startHead: "none",
      endHead: "triangle",
    });
    const initialCurveOffset = existingArrow.props.curveOffset;
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const bodyPoint = projection.worldToCanvas({ x: 15, y: 11 });
    const nextBodyPoint = projection.worldToCanvas({ x: 18, y: 15 });

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
          end: { x: 23, y: 14 },
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
      bodyStyle: "curved",
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
        surface: {
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const controlPoint = projection.worldToCanvas(initialHandlePoint);
    const nextControlPoint = projection.worldToCanvas({ x: 15, y: 5 });

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

  it("moves a selected polyline arrow vertex when dragging its handle", () => {
    const arrowTool = new ArrowTool();
    const existingArrow = createArrowObject({
      id: "arrow-1",
      geometry: "polyline",
      points: [
        { x: 10, y: 10 },
        { x: 15, y: 15 },
        { x: 20, y: 10 },
      ],
      color: "#fff",
      strokeWidth: 2,
      lineStyle: "solid",
      bodyStyle: "straight",
      startHead: "none",
      endHead: "triangle",
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
      surface: store.getState().board.surface,
      viewport: store.getState().ui.viewport,
      canvasRect,
      surfaceInset: 14,
    });
    const middlePoint = projection.worldToCanvas({ x: 15, y: 15 });
    const nextPoint = projection.worldToCanvas({ x: 18, y: 18 });

    controller.dispatchPointerEvent("onPointerDown", {
      clientPoint: middlePoint,
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      canvasRect,
    });
    controller.dispatchPointerEvent("onPointerMove", {
      clientPoint: nextPoint,
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
          geometry: "polyline",
          points: [
            { x: 10, y: 10 },
            { x: 18, y: 18 },
            { x: 20, y: 10 },
          ],
          start: { x: 10, y: 10 },
          end: { x: 20, y: 10 },
        },
      },
    );
  });
});
