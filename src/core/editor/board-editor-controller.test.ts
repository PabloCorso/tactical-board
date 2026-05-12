import { describe, expect, it } from "vitest";
import { createBoardEditorController } from "./board-editor-controller";
import { createToolApi } from "./create-tool-api";
import { createBoardSpaceProjection } from "../geometry/board-space-projection";
import { createBoardEditorStore } from "../store/board-editor-store";
import {
  createArrowObject,
  getArrowCurveHandlePoint,
} from "../objects/arrow-object";
import { createArrowTool, setArrowDraftStyle } from "../../tools/arrow-tool";
import { createShapeTool } from "../../tools/shape-tool";
import { selectTool } from "../../tools/select-tool";
import { setSelectedObjectIds } from "../../tools/select-tool-actions";
import { getArrowToolState } from "../../tools/arrow-tool-state";
import { getSelectToolState } from "../../tools/select-tool-state";
import { getShapeToolState } from "../../tools/shape-tool-state";

describe("createBoardEditorController", () => {
  it("keeps the arrow tool in creation mode when pointer down hits an existing arrow", () => {
    const arrowTool = createArrowTool();
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
    arrowTool.registerRenderers?.(toolApi);

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

  it("resizes a selected arrow by dragging an endpoint handle", () => {
    const arrowTool = createArrowTool();
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
      initialToolId: selectTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerRenderers?.(toolApi);
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

  it("creates a polyline arrow across multiple clicks", () => {
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
      initialToolId: arrowTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerRenderers?.(toolApi);
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

  it("creates a rectangle shape across two clicks", () => {
    const shapeTool = createShapeTool();
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
    shapeTool.registerRenderers?.(toolApi);

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
    controller.dispatchPointerEvent("onPointerDown", {
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
    const shapeTool = createShapeTool({
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
    shapeTool.registerRenderers?.(toolApi);
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

  it("moves a selected arrow when dragging the arrow body", () => {
    const arrowTool = createArrowTool();
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
      initialToolId: selectTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerRenderers?.(toolApi);
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

  it("pans vertically on wheel while the select tool is active", () => {
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
      initialToolId: selectTool.id,
      tools: [selectTool],
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

  it("pans horizontally on shift + wheel while the select tool is active", () => {
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
      initialToolId: selectTool.id,
      tools: [selectTool],
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

  it("preserves a selected curved arrow's bend when dragging the arrow body", () => {
    const arrowTool = createArrowTool();
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
      initialToolId: selectTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerRenderers?.(toolApi);
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
    const arrowTool = createArrowTool();
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
      initialToolId: selectTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerRenderers?.(toolApi);
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
    const arrowTool = createArrowTool();
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
      initialToolId: selectTool.id,
      tools: [selectTool, arrowTool],
    });
    const toolApi = createToolApi(store);
    arrowTool.registerRenderers?.(toolApi);
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
