import { useMemo } from "react";
import { PLAYER_OBJECT_TYPE } from "../../core/objects/player-object";
import { createToolApi } from "../../core/editor/create-tool-api";
import type { BoardEditorState } from "../../core/editor/types";
import { useBoardEditorContext } from "../components/board-editor-context";
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
} from "../components/board-editor-toolbar";
import { useBoardEditorStore } from "../hooks/use-board-editor-store";
import { type ArrowToolPreset } from "../../core/tools/arrow-tool";
import {
  ARROW_TOOL_ID,
  getArrowToolState,
} from "../../core/tools/arrow-tool-state";
import {
  EQUIPMENT_TOOL_ID,
  getEquipmentToolState,
} from "../../core/tools/equipment-tool-state";
import { type PlayerToolPreset } from "../../core/tools/player-tool";
import {
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
} from "../../core/tools/player-tool-state";
import { type ShapeToolPreset } from "../../core/tools/shape-tool";
import {
  getShapeToolState,
  SHAPE_TOOL_ID,
  type ShapeDraftStyle,
} from "../../core/tools/shape-tool-state";
import { FOOTBALL_EQUIPMENT_DEFINITIONS } from "./equipment";
import { FOOTBALL_PLAYER_PRESET_COLORS } from "./football-catalog";
import {
  FootballArrowPresetIcon,
  FootballEquipmentDefinitionIcon,
  FootballPlayerPresetIcon,
  FootballShapePresetIcon,
} from "./football-tool-icons";

export const FOOTBALL_ARROW_PRESETS: Array<
  ArrowToolPreset & {
    variant: "straight-solid" | "wavy" | "curved-solid" | "double";
  }
> = [
  {
    id: "run",
    label: "Run",
    variant: "straight-solid",
    draftStyle: {
      kind: "straight",
    },
  },
  {
    id: "dribble",
    label: "Dribble",
    variant: "wavy",
    draftStyle: {
      kind: "wavy",
    },
  },
  {
    id: "lofted-pass",
    label: "Lofted pass",
    variant: "curved-solid",
    draftStyle: {
      kind: "curved",
    },
  },
  {
    id: "screen",
    label: "Screen",
    variant: "double",
    draftStyle: {
      kind: "double",
    },
  },
];

export const FOOTBALL_SHAPE_PRESETS: Array<
  ShapeToolPreset & {
    variant: "rectangle" | "oval" | "triangle" | "diamond" | "polygon";
  }
> = [
  {
    id: "shape-rectangle",
    label: "Rectangle",
    variant: "rectangle",
    draftStyle: {
      kind: "rectangle",
    },
  },
  {
    id: "shape-oval",
    label: "Oval",
    variant: "oval",
    draftStyle: {
      kind: "oval",
    },
  },
  {
    id: "shape-triangle",
    label: "Triangle",
    variant: "triangle",
    draftStyle: {
      kind: "triangle",
    },
  },
  {
    id: "shape-diamond",
    label: "Diamond",
    variant: "diamond",
    draftStyle: {
      kind: "diamond",
    },
  },
  {
    id: "shape-polygon",
    label: "Polygon",
    variant: "polygon",
    draftStyle: {
      kind: "polygon",
    },
  },
];

export const FOOTBALL_PLAYER_PRESETS: PlayerToolPreset[] =
  FOOTBALL_PLAYER_PRESET_COLORS.map((color, index) => ({
    id: `team-color-${index + 1}`,
    label: String(index + 1),
    tooltip: `Player color ${color}`,
    draftStyle: {
      color,
    },
  }));

function matchesDraftStyle<T extends Record<string, unknown>>(
  current: T,
  preset: Partial<T>,
) {
  return (Object.entries(preset) as Array<[keyof T, T[keyof T]]>).every(
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

export function FootballSecondaryToolbar({
  className,
}: {
  className?: string;
}) {
  const editorStore = useBoardEditorContext();
  const toolApi = useMemo(() => createToolApi(editorStore), [editorStore]);
  const state = useBoardEditorStore(
    editorStore,
    (currentState) => currentState,
  );
  const activeToolId = state.ui.activeToolId;

  if (activeToolId === PLAYER_TOOL_ID) {
    const playerState = getPlayerToolState(state.toolState);

    return (
      <BoardEditorToolbar className={className}>
        {FOOTBALL_PLAYER_PRESETS.map((preset) => {
          const color = preset.draftStyle.color;
          const label =
            typeof color === "string"
              ? getNextPlayerLabel(state, color)
              : preset.label;

          return (
            <BoardEditorToolbarButton
              aria-label={preset.tooltip ?? preset.label}
              active={matchesDraftStyle<PlayerDraftStyle>(
                playerState.draftStyle,
                preset.draftStyle,
              )}
              className="aspect-square rounded-full px-0"
              iconBefore={
                typeof color === "string" ? (
                  <FootballPlayerPresetIcon
                    draftStyle={{
                      ...playerState.draftStyle,
                      ...preset.draftStyle,
                    }}
                    label={label}
                    className="h-7 w-7"
                    width={28}
                    height={28}
                  />
                ) : undefined
              }
              key={preset.id}
              onClick={() => {
                const currentState = getPlayerToolState(
                  toolApi.getState().toolState,
                );
                toolApi.setToolState(PLAYER_TOOL_ID, {
                  ...currentState,
                  draftStyle: {
                    ...currentState.draftStyle,
                    ...preset.draftStyle,
                  },
                });
              }}
              tooltip={preset.tooltip ?? preset.label}
            />
          );
        })}
      </BoardEditorToolbar>
    );
  }

  if (activeToolId === EQUIPMENT_TOOL_ID) {
    const equipmentState = getEquipmentToolState(state.toolState);

    return (
      <BoardEditorToolbar className={className}>
        {FOOTBALL_EQUIPMENT_DEFINITIONS.map((definition) => (
          <BoardEditorToolbarButton
            aria-label={definition.label}
            active={equipmentState.draftStyle.kind === definition.kind}
            className="w-full justify-start"
            iconBefore={
              <FootballEquipmentDefinitionIcon
                definition={definition}
                size={20}
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
            }}
            tooltip={definition.label}
          >
            {definition.label}
          </BoardEditorToolbarButton>
        ))}
      </BoardEditorToolbar>
    );
  }

  if (activeToolId === ARROW_TOOL_ID) {
    const arrowState = getArrowToolState(state.toolState);

    return (
      <BoardEditorToolbar className={className}>
        {FOOTBALL_ARROW_PRESETS.map((preset) => (
          <BoardEditorToolbarButton
            aria-label={preset.tooltip ?? preset.label}
            active={matchesDraftStyle(arrowState.draftStyle, preset.draftStyle)}
            className="w-full justify-start"
            iconBefore={
              <FootballArrowPresetIcon
                draftStyle={{
                  ...arrowState.draftStyle,
                  ...preset.draftStyle,
                }}
              />
            }
            key={preset.id}
            onClick={() => {
              const currentState = getArrowToolState(
                toolApi.getState().toolState,
              );
              toolApi.setToolState(ARROW_TOOL_ID, {
                ...currentState,
                draftStyle: {
                  ...currentState.draftStyle,
                  ...preset.draftStyle,
                },
              });
            }}
            tooltip={preset.tooltip ?? preset.label}
          >
            {preset.label}
          </BoardEditorToolbarButton>
        ))}
      </BoardEditorToolbar>
    );
  }

  if (activeToolId === SHAPE_TOOL_ID) {
    const shapeState = getShapeToolState(state.toolState);

    return (
      <BoardEditorToolbar className={className}>
        {FOOTBALL_SHAPE_PRESETS.map((preset) => (
          <BoardEditorToolbarButton
            aria-label={preset.tooltip ?? preset.label}
            active={matchesDraftStyle<ShapeDraftStyle>(
              shapeState.draftStyle,
              preset.draftStyle,
            )}
            className="w-full justify-start"
            iconBefore={
              <FootballShapePresetIcon
                draftStyle={{
                  ...shapeState.draftStyle,
                  ...preset.draftStyle,
                }}
              />
            }
            key={preset.id}
            onClick={() => {
              const currentState = getShapeToolState(
                toolApi.getState().toolState,
              );
              toolApi.setToolState(SHAPE_TOOL_ID, {
                ...currentState,
                draftStyle: {
                  ...currentState.draftStyle,
                  ...preset.draftStyle,
                },
              });
            }}
            tooltip={preset.tooltip ?? preset.label}
          >
            {preset.label}
          </BoardEditorToolbarButton>
        ))}
      </BoardEditorToolbar>
    );
  }

  return null;
}
