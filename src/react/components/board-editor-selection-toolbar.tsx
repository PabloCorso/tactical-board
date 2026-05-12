import { useMemo } from "react";
import type { BoardObject } from "../../core/board/types";
import { createBoardSpaceProjection } from "../../core/geometry/board-space-projection";
import {
  ARROW_OBJECT_TYPE,
  getArrowCurveHandlePoint,
  type ArrowObject,
} from "../../core/objects/arrow-object";
import {
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../../core/objects/shape-object";
import { getSelectToolState } from "../../tools/select-tool-state";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { BoardEditorArrowSelectionToolbar } from "./board-editor-selection-toolbar-arrow";
import { BoardEditorShapeSelectionToolbar } from "./board-editor-selection-toolbar-shape";
import type { BoardEditorSelectionToolbarRenderer } from "./board-editor-selection-toolbar-types";

const SURFACE_INSET = 14;
const SELECTION_TOOLBAR_OFFSET = 8;

function getSelectionToolbarAnchor(
  projection: ReturnType<typeof createBoardSpaceProjection>,
  selectedObject: BoardObject,
) {
  if (selectedObject.type === ARROW_OBJECT_TYPE) {
    const arrow = selectedObject as ArrowObject;
    if (arrow.props.geometry === "polyline") {
      const bounds = projection.getObjectCanvasBounds(selectedObject);

      return {
        left: bounds.x + bounds.width / 2,
        top: bounds.y - SELECTION_TOOLBAR_OFFSET,
      };
    }

    const start = projection.worldToCanvas(arrow.props.start);
    const end = projection.worldToCanvas(arrow.props.end);
    const controlPoint =
      arrow.props.bodyStyle === "curved"
        ? projection.worldToCanvas(
            getArrowCurveHandlePoint(
              arrow.props.start,
              arrow.props.end,
              arrow.props.curveOffset,
            ),
          )
        : undefined;

    return {
      left: controlPoint
        ? (start.x + end.x + controlPoint.x) / 3
        : (start.x + end.x) / 2,
      top:
        Math.min(start.y, end.y, controlPoint?.y ?? Number.POSITIVE_INFINITY) -
        SELECTION_TOOLBAR_OFFSET,
    };
  }

  const bounds = projection.getObjectCanvasBounds(selectedObject);

  return {
    left: bounds.x + bounds.width / 2,
    top: bounds.y - SELECTION_TOOLBAR_OFFSET,
  };
}

const selectionToolbarRenderers: Record<
  string,
  BoardEditorSelectionToolbarRenderer
> = {
  [ARROW_OBJECT_TYPE]: (props) => (
    <BoardEditorArrowSelectionToolbar
      {...props}
      selectedObject={props.selectedObject as ArrowObject}
    />
  ),
  [SHAPE_OBJECT_TYPE]: (props) => (
    <BoardEditorShapeSelectionToolbar
      {...props}
      selectedObject={props.selectedObject as ShapeObject}
    />
  ),
};

export type BoardEditorSelectionToolbarProps = {
  className?: string;
};

export function BoardEditorSelectionToolbar({
  className,
}: BoardEditorSelectionToolbarProps) {
  const store = useBoardEditorContext();
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const selection = getSelectToolState(state.toolState).selectedObjectIds;

  const selectedObject = useMemo(() => {
    if (selection.length !== 1) {
      return undefined;
    }

    return state.board.objects.byId[selection[0]];
  }, [selection, state.board.objects.byId]);

  if (!selectedObject || !state.ui.canvasRect) {
    return null;
  }

  const renderToolbar = selectionToolbarRenderers[selectedObject.type];
  if (!renderToolbar) {
    return null;
  }

  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect: state.ui.canvasRect,
    surfaceInset: SURFACE_INSET,
  });
  const anchor = getSelectionToolbarAnchor(
    projection,
    selectedObject as BoardObject,
  );

  return renderToolbar({
    className,
    selectedObject,
    toolbarLeft: anchor.left,
    toolbarTop: Math.max(10, anchor.top),
  });
}
