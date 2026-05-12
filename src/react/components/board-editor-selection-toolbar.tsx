import { useMemo } from "react";
import type { BoardObject } from "../../core/board/types";
import { createBoardSpaceProjection } from "../../core/geometry/board-space-projection";
import {
  ARROW_OBJECT_TYPE,
  type ArrowObject,
} from "../../core/objects/arrow-object";
import { getSelectToolState } from "../../tools/select-tool-state";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { BoardEditorArrowSelectionToolbar } from "./board-editor-selection-toolbar-arrow";
import type { BoardEditorSelectionToolbarRenderer } from "./board-editor-selection-toolbar-types";

const SURFACE_INSET = 14;

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
  const bounds = projection.getObjectCanvasBounds(
    selectedObject as BoardObject,
  );

  return renderToolbar({
    className,
    selectedObject,
    toolbarLeft: bounds.x + bounds.width / 2,
    toolbarTop: Math.max(10, bounds.y - 18),
  });
}
