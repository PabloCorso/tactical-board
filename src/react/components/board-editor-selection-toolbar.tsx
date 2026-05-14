import { useMemo } from "react";
import type { BoardObject } from "../../core/board/types";
import { createBoardSpaceProjection } from "../../core/geometry/board-space-projection";
import {
  getObjectSelectionAdapterForObject,
  type SelectionProjection,
} from "../../core/objects/object-selection";
import { getSelectToolState } from "../../tools/select-tool-state";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";

const SURFACE_INSET = 14;

export function getSelectionToolbarAnchor(
  projection: SelectionProjection,
  selectedObject: BoardObject,
  state: Parameters<typeof getObjectSelectionAdapterForObject>[0],
) {
  return getObjectSelectionAdapterForObject(
    state,
    selectedObject,
  )?.getToolbarAnchor?.({
    object: selectedObject,
    projection,
  });
}

export type BoardEditorSelectionToolbarProps = {
  className?: string;
};

export function shouldShowSelectionToolbar(
  selectState: ReturnType<typeof getSelectToolState>,
) {
  return (
    selectState.selectedObjectIds.length === 1 &&
    selectState.interaction?.mode !== "marquee"
  );
}

export function BoardEditorSelectionToolbar({
  className,
}: BoardEditorSelectionToolbarProps) {
  const store = useBoardEditorContext();
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const selectState = getSelectToolState(state.toolState);
  const selection = selectState.selectedObjectIds;

  const selectedObject = useMemo(() => {
    if (!shouldShowSelectionToolbar(selectState)) {
      return undefined;
    }

    return state.board.objects.byId[selection[0]];
  }, [selectState, selection, state.board.objects.byId]);

  if (!selectedObject || !state.ui.canvasRect) {
    return null;
  }

  const selectionAdapter = getObjectSelectionAdapterForObject(
    state,
    selectedObject,
  );
  const ToolbarRenderer = selectionAdapter?.toolbarRenderer;
  if (!ToolbarRenderer) {
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
    state,
  );

  if (!anchor) {
    return null;
  }

  return (
    <ToolbarRenderer
      className={className}
      selectedObject={selectedObject}
      toolbarLeft={anchor.left}
      toolbarTop={Math.max(10, anchor.top)}
    />
  );
}
