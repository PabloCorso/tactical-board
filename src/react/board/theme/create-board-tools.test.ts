import { describe, expect, it } from "vitest";
import { createBoardEditorStore } from "../../../core/store/board-editor-store";
import { createBoardEditorController } from "../../../core/editor/board-editor-controller";
import { createBoardSpaceProjection } from "../../../core/geometry/board-space-projection";
import { ARROW_TOOL_ID } from "../../../core/tools/arrow-tool-state";
import { SELECT_TOOL_ID } from "../../../core/tools/select-tool-state";
import { SHAPE_TOOL_ID } from "../../../core/tools/shape-tool-state";
import { createBoardTools } from "./create-board-tools";

describe("createBoardTools", () => {
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
      tools: createBoardTools(),
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
});
