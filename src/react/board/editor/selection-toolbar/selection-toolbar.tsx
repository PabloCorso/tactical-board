import { useMemo } from "react";
import type { BoardObject } from "../../../../core/board/types";
import { getBoardPlayerGroups } from "../../../../core/board/player-groups";
import { createToolApi } from "../../../../core/editor/create-tool-api";
import {
  getActiveSelectionPresentation,
  type SelectionPresentation,
} from "../../../../core/tools/selection-presentation";
import { createBoardSpaceProjection } from "../../../../core/geometry/board-space-projection";
import { resolveBoardEditorFitPadding } from "../../../../core/editor/fit-padding";
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
import { PlayerTeamSelectionControl } from "./player-team-selection-control";
import { movePlayersToGroup } from "../../team/player-team-commands";
import { useBoardEditorContext } from "../../../adapter/editor/board-editor-context";
import { BoardEditorSelectionActionsMenu } from "./selection-actions-menu";
import { BoardEditorShapeSelectionToolbar } from "./shape-selection-toolbar";
import { BoardEditorTextSelectionToolbar } from "./text-selection-toolbar";
import type { BoardEditorSelectionToolbarRenderer } from "./selection-toolbar-types";
import { BoardEditorSelectionToolbarPositioner } from "./selection-toolbar-positioner";
import {
  BoardEditorToolbar,
  BoardEditorToolbarSeparator,
} from "../toolbar/editor-toolbar";
import type { BoardTheme, BoardThemeAdapters } from "../../theme/board-theme";
import { useBoardEditorLabels } from "../board-editor-labels";
import { BoardEditorObjectColorSelectionControl } from "./object-color-selection-control";
import {
  getObjectColorSelectionState,
  getObjectMeasurementSelectionState,
} from "../../../../core/objects/object-properties";
import { BoardEditorObjectMeasurementSelectionControl } from "./object-measurement-selection-control";

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
  adapters?: Pick<BoardThemeAdapters, "playerAppearanceRenderers">;
  className?: string;
  renderers?: Record<string, BoardEditorSelectionToolbarRenderer>;
  theme?: Pick<BoardTheme, "playerAppearances">;
};

export function shouldShowSelectionToolbar(
  selectState: ReturnType<typeof getSelectToolState>,
  selectedObjectIds: string[],
  presentation: SelectionPresentation = "interactive",
) {
  return (
    presentation === "interactive" &&
    selectedObjectIds.length > 0 &&
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
  adapters,
  className,
  renderers,
  theme,
}: BoardEditorSelectionToolbarProps) {
  const labels = useBoardEditorLabels();
  const store = useBoardEditorContext();
  const toolApi = createToolApi(store);
  const state = useBoardEditorStore(store, (currentState) => currentState);
  const selectState = getSelectToolState(state.toolState);
  const selection = state.selection.selectedObjectIds;
  const selectionPresentation = getActiveSelectionPresentation(state);

  const selectedObject = useMemo(() => {
    if (
      selection.length !== 1 ||
      !shouldShowSelectionToolbar(selectState, selection, selectionPresentation)
    ) {
      return undefined;
    }

    return state.board.objects.byId[selection[0]];
  }, [selectState, selection, selectionPresentation, state.board.objects.byId]);
  const selectedObjects = useMemo(
    () =>
      selection.flatMap((objectId) => {
        const object = state.board.objects.byId[objectId];
        return object ? [object] : [];
      }),
    [selection, state.board.objects.byId],
  );

  if (
    !shouldShowSelectionToolbar(
      selectState,
      selection,
      selectionPresentation,
    ) ||
    !state.ui.canvasRect
  ) {
    return null;
  }

  const projection = createBoardSpaceProjection({
    frame: state.board.frame,
    viewport: state.ui.viewport,
    canvasRect: state.ui.canvasRect,
    fitPadding: resolveBoardEditorFitPadding(state),
  });

  if (selectedObjects.length > 1) {
    const anchor = getMultiSelectionToolbarAnchor(projection, selectedObjects);
    const bounds = getSelectionBounds(projection, selectedObjects);
    const selectedPlayers = selectedObjects.every(
      (object): object is PlayerObject => object.type === PLAYER_OBJECT_TYPE,
    )
      ? selectedObjects
      : undefined;
    const selectedEquipment = selectedObjects.every(
      (object): object is EquipmentObject =>
        object.type === EQUIPMENT_OBJECT_TYPE,
    )
      ? selectedObjects
      : undefined;
    const playerGroups = selectedPlayers
      ? getBoardPlayerGroups(state.board)
      : [];
    const selectedGroupIds = new Set(
      selectedPlayers?.map((player) => player.props.groupId),
    );
    const commonGroupId =
      selectedGroupIds.size === 1 ? [...selectedGroupIds][0] : undefined;
    const hasMixedGroups = selectedGroupIds.size > 1;
    const selectionColor = getObjectColorSelectionState(
      state.board,
      selectedObjects,
    );
    const selectionMeasurement = state.board.frame.measurement
      ? getObjectMeasurementSelectionState(selectedObjects)
      : undefined;

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
        <BoardEditorToolbar
          aria-label={
            selectedPlayers
              ? labels.selectionToolbar.playerProperties
              : selectedEquipment
                ? labels.selectionToolbar.equipmentProperties
                : labels.selectionToolbar.selectionProperties
          }
          className={className}
          controlSize="sm"
        >
          {selectedPlayers && playerGroups.length > 1 ? (
            <>
              <PlayerTeamSelectionControl
                mixed={hasMixedGroups}
                playerGroups={playerGroups}
                value={commonGroupId}
                onValueChange={(groupId) =>
                  movePlayersToGroup(
                    toolApi,
                    selectedPlayers.map((player) => player.id),
                    groupId,
                  )
                }
              />
              <BoardEditorToolbarSeparator />
            </>
          ) : null}
          {selectionColor ? (
            <>
              <BoardEditorObjectColorSelectionControl
                selectedObjects={selectedObjects}
              />
              <BoardEditorToolbarSeparator />
            </>
          ) : null}
          {selectionMeasurement ? (
            <>
              <BoardEditorObjectMeasurementSelectionControl
                selectedObjects={selectedObjects}
              />
              <BoardEditorToolbarSeparator />
            </>
          ) : null}
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
    renderers?.[selectedObject.type] ??
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
      adapters={adapters}
      selectedObject={selectedObject}
      theme={theme}
      toolbarLeft={anchor.left}
      toolbarTop={anchor.top}
      toolbarBottom={bounds.y + bounds.height + SELECTION_TOOLBAR_OFFSET_PX}
      viewportWidth={state.ui.canvasRect.width}
      viewportHeight={state.ui.canvasRect.height}
    />
  );
}
