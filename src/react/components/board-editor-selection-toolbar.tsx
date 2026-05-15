import { useMemo } from "react";
import type { BoardObject } from "../../core/board/types";
import { createBoardSpaceProjection } from "../../core/geometry/board-space-projection";
import {
  getObjectSelectionAdapterForObject,
  type SelectionProjection,
} from "../../core/objects/object-selection";
import { getSelectToolState } from "../../tools/select-tool-state";
import { SELECTION_TOOLBAR_OFFSET_PX } from "../../tools/selection-geometry";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { useBoardEditorContext } from "./board-editor-context";
import { BoardEditorSelectionActionsMenu } from "./board-editor-selection-actions-menu";
import { BoardEditorSelectionToolbarPositioner } from "./board-editor-selection-toolbar-positioner";
import { BoardEditorToolbar } from "./board-editor-toolbar";

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
    selectState.selectedObjectIds.length > 0 &&
    selectState.interaction?.mode !== "marquee"
  );
}

export function getMultiSelectionToolbarAnchor(
  projection: SelectionProjection,
  selectedObjects: BoardObject[],
) {
  if (selectedObjects.length === 0) {
    return undefined;
  }

  const bounds = selectedObjects.map((object) =>
    projection.getObjectCanvasBounds(object),
  );
  const left = Math.min(...bounds.map((bound) => bound.x));
  const right = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const top = Math.min(...bounds.map((bound) => bound.y));

  return {
    left: (left + right) / 2,
    top: top - SELECTION_TOOLBAR_OFFSET_PX,
  };
}

export function getSelectionBounds(
  projection: SelectionProjection,
  selectedObjects: BoardObject[],
) {
  if (selectedObjects.length === 0) {
    return undefined;
  }

  const bounds = selectedObjects.map((object) =>
    projection.getObjectCanvasBounds(object),
  );
  const left = Math.min(...bounds.map((bound) => bound.x));
  const right = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const top = Math.min(...bounds.map((bound) => bound.y));
  const bottom = Math.max(...bounds.map((bound) => bound.y + bound.height));

  return { left, right, top, bottom };
}

export function BoardEditorSelectionToolbar({
  className,
}: BoardEditorSelectionToolbarProps) {
  const store = useBoardEditorContext();
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const selectState = getSelectToolState(state.toolState);
  const selection = selectState.selectedObjectIds;

  const selectedObject = useMemo(() => {
    if (selection.length !== 1 || !shouldShowSelectionToolbar(selectState)) {
      return undefined;
    }

    return state.board.objects.byId[selection[0]];
  }, [selectState, selection, state.board.objects.byId]);
  const selectedObjects = useMemo(
    () =>
      selection.flatMap((objectId) => {
        const object = state.board.objects.byId[objectId];
        return object ? [object] : [];
      }),
    [selection, state.board.objects.byId],
  );

  if (!shouldShowSelectionToolbar(selectState) || !state.ui.canvasRect) {
    return null;
  }

  const projection = createBoardSpaceProjection({
    surface: state.board.surface,
    viewport: state.ui.viewport,
    canvasRect: state.ui.canvasRect,
    surfaceInset: SURFACE_INSET,
  });

  if (selectedObjects.length > 1) {
    const anchor = getMultiSelectionToolbarAnchor(projection, selectedObjects);
    const bounds = getSelectionBounds(projection, selectedObjects);

    if (!anchor || !bounds) {
      return null;
    }

    return (
      <BoardEditorSelectionToolbarPositioner
        anchorLeft={anchor.left}
        anchorTop={anchor.top}
        anchorBottom={bounds.bottom + SELECTION_TOOLBAR_OFFSET_PX}
        viewportWidth={state.ui.canvasRect.width}
        viewportHeight={state.ui.canvasRect.height}
      >
        <BoardEditorToolbar className={className}>
          <BoardEditorSelectionActionsMenu
            selectedObjectIds={selectedObjects.map((object) => object.id)}
            showSeparator={false}
          />
        </BoardEditorToolbar>
      </BoardEditorSelectionToolbarPositioner>
    );
  }

  if (!selectedObject) {
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

  const anchor = getSelectionToolbarAnchor(
    projection,
    selectedObject as BoardObject,
    state,
  );

  if (!anchor) {
    return null;
  }

  const bounds = projection.getObjectCanvasBounds(selectedObject);

  return (
    <ToolbarRenderer
      className={className}
      selectedObject={selectedObject}
      toolbarLeft={anchor.left}
      toolbarTop={anchor.top}
      toolbarBottom={bounds.y + bounds.height + SELECTION_TOOLBAR_OFFSET_PX}
      viewportWidth={state.ui.canvasRect.width}
      viewportHeight={state.ui.canvasRect.height}
    />
  );
}
