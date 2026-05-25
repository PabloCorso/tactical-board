import { useMemo } from "react";
import type { BoardObject } from "../../../../core/board/types";
import { createBoardSpaceProjection } from "../../../../core/geometry/board-space-projection";
import {
  ARROW_OBJECT_TYPE,
  type ArrowObject,
} from "../../../../core/objects/arrow-object";
import {
  EQUIPMENT_OBJECT_TYPE,
  type EquipmentObject,
} from "../../../../core/objects/equipment-object";
import {
  getObjectSelectionAdapterForObject,
  type SelectionProjection,
} from "../../../../core/objects/object-selection";
import {
  PLAYER_OBJECT_TYPE,
  type PlayerObject,
} from "../../../../core/objects/player-object";
import {
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../../../../core/objects/shape-object";
import {
  TEXT_OBJECT_TYPE,
  type TextObject,
} from "../../../../core/objects/text-object";
import { getSelectToolState } from "../../../../core/tools/select-tool-state";
import { SELECTION_TOOLBAR_OFFSET_PX } from "../../../../core/tools/selection-geometry";
import { useBoardEditorStore } from "../../../adapter/editor/use-board-editor-store";
import { BoardEditorArrowSelectionToolbar } from "./arrow-selection-toolbar";
import { BoardEditorEquipmentSelectionToolbar } from "./equipment-selection-toolbar";
import { BoardEditorPlayerSelectionToolbar } from "./player-selection-toolbar";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import { BoardEditorShapeSelectionToolbar } from "./shape-selection-toolbar";
import { BoardEditorTextSelectionToolbar } from "./text-selection-toolbar";
import type { BoardEditorSelectionToolbarRenderer } from "./selection-toolbar-types";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import { BoardEditorToolbar } from "../toolbar/editor-toolbar";

const DEFAULT_SELECTION_TOOLBAR_RENDERERS: Record<
  string,
  BoardEditorSelectionToolbarRenderer
> = {
  [ARROW_OBJECT_TYPE]: (props) => (
    <BoardEditorArrowSelectionToolbar
      {...props}
      selectedObject={props.selectedObject as ArrowObject}
    />
  ),
  [EQUIPMENT_OBJECT_TYPE]: (props) => (
    <BoardEditorEquipmentSelectionToolbar
      {...props}
      selectedObject={props.selectedObject as EquipmentObject}
    />
  ),
  [PLAYER_OBJECT_TYPE]: (props) => (
    <BoardEditorPlayerSelectionToolbar
      {...props}
      selectedObject={props.selectedObject as PlayerObject}
    />
  ),
  [SHAPE_OBJECT_TYPE]: (props) => (
    <BoardEditorShapeSelectionToolbar
      {...props}
      selectedObject={props.selectedObject as ShapeObject}
    />
  ),
  [TEXT_OBJECT_TYPE]: (props) => (
    <BoardEditorTextSelectionToolbar
      {...props}
      selectedObject={props.selectedObject as TextObject}
    />
  ),
};

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
  selectedObjectIds: string[],
) {
  return (
    selectedObjectIds.length > 0 && selectState.interaction?.mode !== "marquee"
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
  const selection = state.selection.selectedObjectIds;

  const selectedObject = useMemo(() => {
    if (
      selection.length !== 1 ||
      !shouldShowSelectionToolbar(selectState, selection)
    ) {
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

  if (
    !shouldShowSelectionToolbar(selectState, selection) ||
    !state.ui.canvasRect
  ) {
    return null;
  }

  const projection = createBoardSpaceProjection({
    frame: state.board.frame,
    viewport: state.ui.viewport,
    canvasRect: state.ui.canvasRect,
    fitPadding: state.ui.fitPadding,
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
          />
        </BoardEditorToolbar>
      </BoardEditorSelectionToolbarPositioner>
    );
  }

  if (!selectedObject) {
    return null;
  }

  const ToolbarRenderer =
    DEFAULT_SELECTION_TOOLBAR_RENDERERS[selectedObject.type];
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
