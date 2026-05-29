import { useMemo } from "react";
import { EQUIPMENT_OBJECT_TYPE } from "../../../core/objects/equipment-object";
import { PLAYER_OBJECT_TYPE } from "../../../core/objects/player-object";
import { createToolApi } from "../../../core/editor/create-tool-api";
import type { BoardEditorState } from "../../../core/editor/types";
import {
  ARROW_TOOL_ID,
  getArrowToolState,
} from "../../../core/tools/arrow-tool-state";
import type { ArrowToolDefault } from "../../../core/tools/arrow-tool";
import {
  EQUIPMENT_TOOL_ID,
  getEquipmentToolState,
} from "../../../core/tools/equipment-tool-state";
import {
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
} from "../../../core/tools/player-tool-state";
import type { PlayerToolDefault } from "../../../core/tools/player-tool";
import {
  getShapeToolState,
  SHAPE_TOOL_ID,
  type ShapeDraftStyle,
} from "../../../core/tools/shape-tool-state";
import type { ShapeToolDefault } from "../../../core/tools/shape-tool";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  type BoardEditorToolbarProps,
} from "../editor/toolbar/editor-toolbar";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import {
  createThemeObjectRenderer,
  type BoardThemeAdapters,
  type BoardTheme,
} from "../theme/board-theme";
import { getThemeEquipmentDefinitions } from "../theme/equipment-object-adapter";
import {
  BoardArrowDefaultIcon,
  BoardEquipmentDefinitionIcon,
  BoardPlayerDefaultIcon,
  BoardShapeDefaultIcon,
} from "./tool-icons";
import {
  BOARD_ARROW_DEFAULTS,
  BOARD_PLAYER_DEFAULTS,
  BOARD_SHAPE_DEFAULTS,
} from "../theme/board-tool-defaults";

function matchesDraftStyle<T extends Record<string, unknown>>(
  current: T,
  toolDefault: Partial<T>,
) {
  return (Object.entries(toolDefault) as Array<[keyof T, T[keyof T]]>).every(
    ([key, value]) => JSON.stringify(current[key]) === JSON.stringify(value),
  );
}

function parseNumericLabel(label: unknown) {
  if (typeof label !== "string" || label.trim() === "") {
    return undefined;
  }

  const value = Number.parseInt(label, 10);

  if (!Number.isFinite(value) || String(value) !== label.trim()) {
    return undefined;
  }

  return value;
}

function getNextPlayerLabel(state: BoardEditorState, color: string) {
  const playerState = getPlayerToolState(state.toolState);
  const colorKey = color.trim().toLowerCase();
  const nextLabelFromState = playerState.nextNumericLabelByColor[colorKey] ?? 1;
  const nextLabelFromBoard =
    Math.max(
      0,
      ...Object.values(state.board.objects.byId)
        .filter(
          (object) =>
            object.type === PLAYER_OBJECT_TYPE &&
            typeof object.props.color === "string" &&
            object.props.color.trim().toLowerCase() === colorKey,
        )
        .map((object) => parseNumericLabel(object.props.label))
        .filter((value): value is number => typeof value === "number"),
    ) + 1;

  return String(Math.max(nextLabelFromState, nextLabelFromBoard));
}

export type BoardSecondaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  arrowDefaults?: ArrowToolDefault[];
  playerDefaults?: PlayerToolDefault[];
  shapeDefaults?: ShapeToolDefault[];
  theme?: Pick<BoardTheme, "objects">;
  adapters?: BoardThemeAdapters;
  onRequestDismiss?: () => void;
};

const SECONDARY_TOOLBAR_BUTTON_SIZE = "md";
const SECONDARY_TOOLBAR_ICON_SIZE = "xl";
const SECONDARY_TOOLBAR_ICON_BUTTON_CLASS_NAME = "aspect-square px-0";

export function BoardSecondaryToolbar({
  arrowDefaults = BOARD_ARROW_DEFAULTS,
  orientation = "vertical",
  playerDefaults = BOARD_PLAYER_DEFAULTS,
  shapeDefaults = BOARD_SHAPE_DEFAULTS,
  adapters,
  theme,
  onRequestDismiss,
  ...toolbarProps
}: BoardSecondaryToolbarProps) {
  const editorStore = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const state = useBoardEditorStore(
    editorStore,
    (currentState) => currentState,
  );
  const activeToolId = state.ui.activeToolId;
  const equipmentDefinitions = getThemeEquipmentDefinitions(theme);
  const equipmentRenderer = useMemo(
    () =>
      createThemeObjectRenderer({
        adapters,
        theme,
        type: EQUIPMENT_OBJECT_TYPE,
      }),
    [adapters, theme],
  );

  if (activeToolId === PLAYER_TOOL_ID && playerDefaults.length > 0) {
    const playerState = getPlayerToolState(state.toolState);

    return (
      <BoardEditorToolbar
        {...toolbarProps}
        orientation={orientation}
        tooltipSide="right"
      >
        {playerDefaults.map((toolDefault) => {
          const color = toolDefault.draftStyle.color;
          const label =
            typeof color === "string"
              ? getNextPlayerLabel(state, color)
              : toolDefault.label;
          const draftStyle = {
            ...playerState.draftStyle,
            ...toolDefault.draftStyle,
          };

          return (
            <BoardEditorToolbarButton
              aria-label={toolDefault.tooltip ?? toolDefault.label}
              active={matchesDraftStyle<PlayerDraftStyle>(
                playerState.draftStyle,
                toolDefault.draftStyle,
              )}
              className={SECONDARY_TOOLBAR_ICON_BUTTON_CLASS_NAME}
              iconBefore={
                <BoardPlayerDefaultIcon
                  draftStyle={draftStyle}
                  label={label}
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
              }
              key={toolDefault.id}
              onClick={() => {
                const currentState = getPlayerToolState(
                  toolApi.getState().toolState,
                );
                toolApi.setToolState(PLAYER_TOOL_ID, {
                  ...currentState,
                  draftStyle: {
                    ...currentState.draftStyle,
                    ...toolDefault.draftStyle,
                  },
                });
                onRequestDismiss?.();
              }}
              iconSize={SECONDARY_TOOLBAR_ICON_SIZE}
              size={SECONDARY_TOOLBAR_BUTTON_SIZE}
              tooltip={toolDefault.tooltip ?? toolDefault.label}
            />
          );
        })}
      </BoardEditorToolbar>
    );
  }

  if (
    activeToolId === EQUIPMENT_TOOL_ID &&
    equipmentDefinitions.length > 0 &&
    equipmentRenderer
  ) {
    const equipmentState = getEquipmentToolState(state.toolState);

    return (
      <BoardEditorToolbar
        {...toolbarProps}
        orientation={orientation}
        tooltipSide="right"
      >
        {equipmentDefinitions.map((definition) => (
          <BoardEditorToolbarButton
            aria-label={definition.label}
            active={equipmentState.draftStyle.kind === definition.kind}
            className={SECONDARY_TOOLBAR_ICON_BUTTON_CLASS_NAME}
            iconBefore={
              <BoardEquipmentDefinitionIcon
                definition={definition}
                renderer={equipmentRenderer}
                size={24}
              />
            }
            key={definition.kind}
            onClick={() => {
              const currentState = getEquipmentToolState(
                toolApi.getState().toolState,
              );
              toolApi.setToolState(EQUIPMENT_TOOL_ID, {
                ...currentState,
                draftStyle: {
                  ...currentState.draftStyle,
                  kind: definition.kind,
                },
              });
              onRequestDismiss?.();
            }}
            iconSize={SECONDARY_TOOLBAR_ICON_SIZE}
            size={SECONDARY_TOOLBAR_BUTTON_SIZE}
            tooltip={definition.label}
          />
        ))}
      </BoardEditorToolbar>
    );
  }

  if (activeToolId === ARROW_TOOL_ID && arrowDefaults.length > 0) {
    const arrowState = getArrowToolState(state.toolState);

    return (
      <BoardEditorToolbar
        {...toolbarProps}
        orientation={orientation}
        tooltipSide="right"
      >
        {arrowDefaults.map((toolDefault) => {
          const draftStyle = {
            ...arrowState.draftStyle,
            ...toolDefault.draftStyle,
          };

          return (
            <BoardEditorToolbarButton
              aria-label={toolDefault.tooltip ?? toolDefault.label}
              active={matchesDraftStyle(
                arrowState.draftStyle,
                toolDefault.draftStyle,
              )}
              className={SECONDARY_TOOLBAR_ICON_BUTTON_CLASS_NAME}
              iconBefore={
                <BoardArrowDefaultIcon
                  draftStyle={draftStyle}
                  className="h-6 w-6 overflow-visible"
                  width={24}
                  height={24}
                />
              }
              key={toolDefault.id}
              onClick={() => {
                const currentState = getArrowToolState(
                  toolApi.getState().toolState,
                );
                toolApi.setToolState(ARROW_TOOL_ID, {
                  ...currentState,
                  draftStyle: {
                    ...currentState.draftStyle,
                    ...toolDefault.draftStyle,
                  },
                });
                onRequestDismiss?.();
              }}
              iconSize={SECONDARY_TOOLBAR_ICON_SIZE}
              size={SECONDARY_TOOLBAR_BUTTON_SIZE}
              tooltip={toolDefault.tooltip ?? toolDefault.label}
            />
          );
        })}
      </BoardEditorToolbar>
    );
  }

  if (activeToolId === SHAPE_TOOL_ID && shapeDefaults.length > 0) {
    const shapeState = getShapeToolState(state.toolState);

    return (
      <BoardEditorToolbar
        {...toolbarProps}
        orientation={orientation}
        tooltipSide="right"
      >
        {shapeDefaults.map((toolDefault) => {
          const draftStyle = {
            ...shapeState.draftStyle,
            ...toolDefault.draftStyle,
          };

          return (
            <BoardEditorToolbarButton
              aria-label={toolDefault.tooltip ?? toolDefault.label}
              active={matchesDraftStyle<ShapeDraftStyle>(
                shapeState.draftStyle,
                toolDefault.draftStyle,
              )}
              className={SECONDARY_TOOLBAR_ICON_BUTTON_CLASS_NAME}
              iconBefore={
                <BoardShapeDefaultIcon
                  draftStyle={draftStyle}
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
              }
              key={toolDefault.id}
              onClick={() => {
                const currentState = getShapeToolState(
                  toolApi.getState().toolState,
                );
                toolApi.setToolState(SHAPE_TOOL_ID, {
                  ...currentState,
                  draftStyle: {
                    ...currentState.draftStyle,
                    ...toolDefault.draftStyle,
                  },
                });
                onRequestDismiss?.();
              }}
              iconSize={SECONDARY_TOOLBAR_ICON_SIZE}
              size={SECONDARY_TOOLBAR_BUTTON_SIZE}
              tooltip={toolDefault.tooltip ?? toolDefault.label}
            />
          );
        })}
      </BoardEditorToolbar>
    );
  }

  return null;
}
