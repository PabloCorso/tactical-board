import { useMemo } from "react";
import { EQUIPMENT_OBJECT_TYPE } from "../../../core/objects/equipment-object";
import { createToolApi } from "../../../core/editor/create-tool-api";
import { getNextNumericPlayerLabel } from "../../../core/tools/player-labels";
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
import {
  PlayerTool,
  type PlayerToolDefault,
} from "../../../core/tools/player-tool";
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
  useBoardEditorToolbarDockOptional,
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
import { useBoardEditorLabels } from "../editor/board-editor-labels";
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

export type BoardEditorSecondaryToolbarProps = Omit<
  BoardEditorToolbarProps,
  "children"
> & {
  arrowDefaults?: ArrowToolDefault[];
  playerDefaults?: PlayerToolDefault[];
  shapeDefaults?: ShapeToolDefault[];
  theme?: Pick<BoardTheme, "objects">;
  adapters?: BoardThemeAdapters;
};

const SECONDARY_TOOLBAR_BUTTON_SIZE = "md";
const SECONDARY_TOOLBAR_ICON_SIZE = "xl";
const SECONDARY_TOOLBAR_ICON_BUTTON_CLASS_NAME = "aspect-square px-0";

export function BoardEditorSecondaryToolbar({
  arrowDefaults: arrowDefaultsProp,
  orientation = "vertical",
  playerDefaults: playerDefaultsProp,
  shapeDefaults: shapeDefaultsProp,
  adapters,
  theme,
  ...toolbarProps
}: BoardEditorSecondaryToolbarProps) {
  const labels = useBoardEditorLabels();
  const arrowDefaults = arrowDefaultsProp ?? BOARD_ARROW_DEFAULTS;
  const playerDefaults = playerDefaultsProp ?? BOARD_PLAYER_DEFAULTS;
  const shapeDefaults = shapeDefaultsProp ?? BOARD_SHAPE_DEFAULTS;
  const editorStore = useBoardEditorContext();
  const toolbarDock = useBoardEditorToolbarDockOptional();
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
    const playerTool = state.toolRegistry.definitions[PLAYER_TOOL_ID];
    const usesNumericLabels =
      playerTool instanceof PlayerTool &&
      playerTool.labelStrategy === "numeric-by-color";

    return (
      <BoardEditorToolbar
        {...toolbarProps}
        orientation={orientation}
        tooltipSide="right"
      >
        {playerDefaults.map((toolDefault) => {
          const color = toolDefault.draftStyle.color;
          const label =
            usesNumericLabels && typeof color === "string"
              ? getNextNumericPlayerLabel(state.board, color)
              : undefined;
          const draftStyle = {
            ...playerState.draftStyle,
            ...toolDefault.draftStyle,
          };

          const buttonLabel = getPlayerDefaultLabel(toolDefault, labels);

          return (
            <BoardEditorToolbarButton
              aria-label={buttonLabel}
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
                toolbarDock?.requestDismiss();
              }}
              iconSize={SECONDARY_TOOLBAR_ICON_SIZE}
              size={SECONDARY_TOOLBAR_BUTTON_SIZE}
              tooltip={buttonLabel}
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
              toolbarDock?.requestDismiss();
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

          const buttonLabel = getArrowDefaultLabel(toolDefault, labels);

          return (
            <BoardEditorToolbarButton
              aria-label={buttonLabel}
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
                toolbarDock?.requestDismiss();
              }}
              iconSize={SECONDARY_TOOLBAR_ICON_SIZE}
              size={SECONDARY_TOOLBAR_BUTTON_SIZE}
              tooltip={buttonLabel}
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

          const buttonLabel = getShapeDefaultLabel(toolDefault, labels);

          return (
            <BoardEditorToolbarButton
              aria-label={buttonLabel}
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
                toolbarDock?.requestDismiss();
              }}
              iconSize={SECONDARY_TOOLBAR_ICON_SIZE}
              size={SECONDARY_TOOLBAR_BUTTON_SIZE}
              tooltip={buttonLabel}
            />
          );
        })}
      </BoardEditorToolbar>
    );
  }

  return null;
}

function getPlayerDefaultLabel(
  toolDefault: PlayerToolDefault,
  labels: ReturnType<typeof useBoardEditorLabels>,
) {
  return (
    toolDefault.tooltip ??
    toolDefault.label ??
    labels.secondaryToolbar.playerColor
  );
}

function getArrowDefaultLabel(
  toolDefault: ArrowToolDefault,
  labels: ReturnType<typeof useBoardEditorLabels>,
) {
  const defaultLabels: Record<string, string> = {
    dribble: labels.secondaryToolbar.arrowDefaults.dribble,
    line: labels.secondaryToolbar.arrowDefaults.line,
    "lofted-pass": labels.secondaryToolbar.arrowDefaults.loftedPass,
    run: labels.secondaryToolbar.arrowDefaults.run,
    screen: labels.secondaryToolbar.arrowDefaults.screen,
  };

  return (
    toolDefault.tooltip ??
    toolDefault.label ??
    defaultLabels[toolDefault.id] ??
    toolDefault.id
  );
}

function getShapeDefaultLabel(
  toolDefault: ShapeToolDefault,
  labels: ReturnType<typeof useBoardEditorLabels>,
) {
  const defaultLabels: Record<string, string> = {
    "shape-diamond": labels.secondaryToolbar.shapeDefaults.diamond,
    "shape-oval": labels.secondaryToolbar.shapeDefaults.oval,
    "shape-polygon": labels.secondaryToolbar.shapeDefaults.polygon,
    "shape-rectangle": labels.secondaryToolbar.shapeDefaults.rectangle,
    "shape-triangle": labels.secondaryToolbar.shapeDefaults.triangle,
  };

  return (
    toolDefault.tooltip ??
    toolDefault.label ??
    defaultLabels[toolDefault.id] ??
    toolDefault.id
  );
}
