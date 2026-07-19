import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "../../../core/store/board-editor-store";
import { createBoardEditorController } from "../../../core/editor/board-editor-controller";
import { createBoardSpaceProjection } from "../../../core/geometry/board-space-projection";
import {
  createEquipmentObject,
  EQUIPMENT_OBJECT_TYPE,
} from "../../../core/objects/equipment-object";
import type { ObjectDefinition } from "../../../core/objects/types";
import { PLAYER_OBJECT_TYPE } from "../../../core/objects/player-object";
import { ARROW_TOOL_ID } from "../../../core/tools/arrow-tool-state";
import { SELECT_TOOL_ID } from "../../../core/tools/select-tool-state";
import { SHAPE_TOOL_ID } from "../../../core/tools/shape-tool-state";
import { createBoardEditorConfig } from "./create-board-editor-config";
import { createEquipmentObjectAdapter } from "./equipment-object-adapter";
import type { BoardTheme } from "./board-theme";

describe("createBoardEditorConfig", () => {
  it("lets Host Apps add or replace Object Definitions and Tools directly", () => {
    const customPlayerDefinition = {
      type: PLAYER_OBJECT_TYPE,
      canvas: { render: () => undefined },
    } satisfies ObjectDefinition;
    const customObjectDefinition = {
      type: "host-object",
      canvas: { render: () => undefined },
    } satisfies ObjectDefinition;
    const customSelectTool = {
      id: SELECT_TOOL_ID,
      label: "Host Select",
    };

    const config = createBoardEditorConfig({
      objectDefinitions: [customPlayerDefinition, customObjectDefinition],
      tools: [customSelectTool],
    });

    expect(
      config.objectDefinitions.filter(
        ({ type }) => type === PLAYER_OBJECT_TYPE,
      ),
    ).toEqual([customPlayerDefinition]);
    expect(config.objectDefinitions).toContain(customObjectDefinition);
    expect(config.tools.filter(({ id }) => id === SELECT_TOOL_ID)).toEqual([
      customSelectTool,
    ]);
  });

  it("selects a created shape but keeps the arrow tool ready for repeated drawing", () => {
    const store = createBoardEditorStore({
      initialBoard: {
        id: "board-1",
        version: 1,
        metadata: {},
        frame: { width: 100, height: 50 },
        objects: { byId: {}, order: [] },
        style: {},
      },
      ...createBoardEditorConfig(),
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
    const dispatchPointer = (
      handlerName: "onPointerDown" | "onPointerMove" | "onPointerUp",
      point: { x: number; y: number },
    ) =>
      controller.dispatchPointerEvent(handlerName, {
        clientPoint: point,
        pointerId: 1,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        canvasRect,
      });

    store.getState().actions.setActiveTool(SHAPE_TOOL_ID);
    const shapePoint = projection.boardToCanvas({ x: 20, y: 15 });
    dispatchPointer("onPointerDown", shapePoint);
    dispatchPointer("onPointerUp", shapePoint);

    const createdShapeId = store.getState().board.objects.order[0];
    expect(store.getState().ui.activeToolId).toBe(SELECT_TOOL_ID);
    expect(store.getState().selection.selectedObjectIds).toEqual([
      createdShapeId,
    ]);

    store.getState().actions.setActiveTool(ARROW_TOOL_ID);
    const arrowStart = projection.boardToCanvas({ x: 10, y: 10 });
    const arrowEnd = projection.boardToCanvas({ x: 30, y: 20 });
    dispatchPointer("onPointerDown", arrowStart);
    dispatchPointer("onPointerMove", arrowEnd);
    dispatchPointer("onPointerUp", arrowEnd);

    expect(store.getState().ui.activeToolId).toBe(ARROW_TOOL_ID);
    expect(store.getState().selection.selectedObjectIds).toEqual([]);
    expect(
      Object.values(store.getState().board.objects.byId).some(
        (object) => object.type === "arrow",
      ),
    ).toBe(true);
  });

  it("keeps equipment behavior scoped to each editor configuration", () => {
    const equipment = createEquipmentObject({
      id: "shared-equipment",
      position: { x: 20, y: 20 },
      size: { width: 10, height: 4 },
      kind: "shared-kind",
      color: "#000000",
    });
    const createTheme = (hitTestShape: "rect" | "circle") =>
      ({
        id: hitTestShape,
        name: hitTestShape,
        objects: [
          {
            type: EQUIPMENT_OBJECT_TYPE,
            kind: equipment.props.kind,
            label: "Shared equipment",
            defaultSize: { width: 10, height: 4 },
            minimumHitRadiusPx: 0,
            hitTestShape,
          },
        ],
      }) satisfies BoardTheme;
    const createStore = (theme: BoardTheme) =>
      createBoardEditorStore({
        initialBoard: {
          id: `board-${theme.id}`,
          version: 1,
          metadata: {},
          frame: { width: 100, height: 50 },
          objects: {
            byId: { [equipment.id]: equipment },
            order: [equipment.id],
          },
          style: {},
        },
        ...createBoardEditorConfig({
          theme,
          adapters: { objectAdapters: [createEquipmentObjectAdapter()] },
        }),
      });
    const rectStore = createStore(createTheme("rect"));
    const circleStore = createStore(createTheme("circle"));
    const projection = createBoardSpaceProjection({
      frame: rectStore.getState().board.frame,
      viewport: rectStore.getState().ui.viewport,
      canvasRect: { width: 100, height: 50 },
    });
    const input = {
      board: rectStore.getState().board,
      object: equipment,
      canvasPoint: projection.boardToCanvas({ x: 24.9, y: 21.9 }),
      frameTransform: projection,
      minimumHitRadiusPx: 0,
    };
    const rectHitTest =
      rectStore.getState().objectRegistry.definitions[EQUIPMENT_OBJECT_TYPE]
        ?.canvas?.hitTest;
    const circleHitTest =
      circleStore.getState().objectRegistry.definitions[EQUIPMENT_OBJECT_TYPE]
        ?.canvas?.hitTest;

    expect(rectHitTest?.(input)).toBe(true);
    expect(circleHitTest?.(input)).toBe(false);
    expect(rectHitTest?.(input)).toBe(true);
  });
});
