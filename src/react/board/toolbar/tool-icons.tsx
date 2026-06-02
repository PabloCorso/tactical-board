import { useMemo } from "react";
import type { BoardEditorState } from "../../../core/editor/types";
import { DEFAULT_BOARD_COLOR } from "../../../core/colors/default-colors";
import {
  createEquipmentObject,
  type EquipmentDefinition,
} from "../../../core/objects/equipment-object";
import type { CanvasObjectRenderer } from "../../../core/rendering/canvas/types";
import { createPlayerObject } from "../../../core/objects/player-object";
import {
  createShapeObject,
  type ShapeKind,
} from "../../../core/objects/shape-object";
import { BoardEditorArrowIcon } from "../editor/arrow-icon";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { cn } from "../../ui/misc";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { PlayerTool, renderPlayer } from "../../../core/tools/player-tool";
import { getNextNumericPlayerLabel } from "../../../core/tools/player-labels";
import { ArrowTool } from "../../../core/tools/arrow-tool";
import {
  getArrowToolState,
  ARROW_TOOL_ID,
  type ArrowDraftStyle,
} from "../../../core/tools/arrow-tool-state";
import { getEquipmentToolState } from "../../../core/tools/equipment-tool-state";
import {
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
} from "../../../core/tools/player-tool-state";
import { renderShape, ShapeTool } from "../../../core/tools/shape-tool";
import {
  getShapeToolState,
  SHAPE_TOOL_ID,
  type ShapeDraftStyle,
} from "../../../core/tools/shape-tool-state";
import { BoardToolIconCanvas } from "./tool-icon-canvas";

const THEME_AWARE_TOOL_ICON_COLORS = new Set<string>([
  DEFAULT_BOARD_COLOR.black,
  DEFAULT_BOARD_COLOR.white,
  DEFAULT_BOARD_COLOR.mediumGray,
  DEFAULT_BOARD_COLOR.lightGray,
]);
const EQUILATERAL_TRIANGLE_HEIGHT_RATIO = Math.sqrt(3) / 2;

export function getThemeAwareToolIconColor(color: string | undefined) {
  if (!color) {
    return color;
  }

  return THEME_AWARE_TOOL_ICON_COLORS.has(color.trim().toLowerCase())
    ? "currentColor"
    : color;
}

export function BoardPlayerDefaultIcon({
  draftStyle,
  label,
  className,
  width = 24,
  height = 24,
}: {
  draftStyle: PlayerDraftStyle;
  label?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const player = useMemo(
    () =>
      createPlayerObject({
        id: "player-icon-preview",
        position: { x: 0, y: 0 },
        size: {
          width: draftStyle.size,
          height: draftStyle.size,
        },
        color: draftStyle.color,
        label,
      }),
    [draftStyle, label],
  );

  return (
    <BoardToolIconCanvas
      object={player}
      renderer={renderPlayer}
      className={cn("h-6 w-6", className)}
      width={width}
      height={height}
    />
  );
}

export function getPlayerToolIconDraftStyle(
  state: Pick<BoardEditorState, "toolRegistry" | "toolState">,
) {
  const playerTool = state.toolRegistry.definitions[PLAYER_TOOL_ID];

  if (
    !(PLAYER_TOOL_ID in state.toolState) &&
    playerTool instanceof PlayerTool
  ) {
    return playerTool.getActivatedDraftStyle(state.toolState);
  }

  return getPlayerToolState(state.toolState).draftStyle;
}

export function BoardPlayerToolIcon({
  fallbackColor = DEFAULT_BOARD_COLOR.black,
}: {
  fallbackColor?: string;
} = {}) {
  const store = useBoardEditorContext();
  const toolRegistry = useBoardEditorStore(
    store,
    (state) => state.toolRegistry,
  );
  const playerTool = toolRegistry.definitions[PLAYER_TOOL_ID];
  const toolState = useBoardEditorStore(store, (state) => state.toolState);
  const board = useBoardEditorStore(store, (state) => state.board);
  const draftStyle = useMemo(
    () => getPlayerToolIconDraftStyle({ toolRegistry, toolState }),
    [toolRegistry, toolState],
  );
  const color = draftStyle.color || fallbackColor;
  const label = useMemo(
    () =>
      playerTool instanceof PlayerTool &&
      playerTool.labelStrategy === "numeric-by-color"
        ? getNextNumericPlayerLabel(board, color)
        : undefined,
    [board, color, playerTool],
  );

  return <BoardPlayerDefaultIcon draftStyle={draftStyle} label={label} />;
}

export function BoardArrowDefaultIcon({
  draftStyle,
  className,
  width = 24,
  height = 24,
}: {
  draftStyle: Pick<
    ArrowDraftStyle,
    | "kind"
    | "color"
    | "strokeWidth"
    | "lineStyle"
    | "dashStyle"
    | "startHead"
    | "endHead"
  >;
  className?: string;
  width?: number;
  height?: number;
}) {
  const iconDraftStyle = {
    ...draftStyle,
    color: getThemeAwareToolIconColor(draftStyle.color),
  };

  return (
    <BoardEditorArrowIcon
      draftStyle={iconDraftStyle}
      className={cn("h-6 w-6 overflow-visible", className)}
      width={width}
      height={height}
      layout="compact"
    />
  );
}

export function BoardArrowToolIcon() {
  const store = useBoardEditorContext();
  const toolRegistry = useBoardEditorStore(
    store,
    (state) => state.toolRegistry,
  );
  const toolState = useBoardEditorStore(store, (state) => state.toolState);
  const draftStyle = useMemo(
    () => getArrowToolIconDraftStyle({ toolRegistry, toolState }),
    [toolRegistry, toolState],
  );

  return (
    <BoardEditorArrowIcon
      draftStyle={{
        ...draftStyle,
        color: getThemeAwareToolIconColor(draftStyle.color),
      }}
      className="h-6 w-6 overflow-visible"
      width={24}
      height={24}
      layout="compact"
    />
  );
}

export function getArrowToolIconDraftStyle(
  state: Pick<BoardEditorState, "toolRegistry" | "toolState">,
) {
  const arrowTool = state.toolRegistry.definitions[ARROW_TOOL_ID];

  if (arrowTool instanceof ArrowTool) {
    return arrowTool.getActivatedDraftStyle(state.toolState);
  }

  return getArrowToolState(state.toolState).draftStyle;
}

export function BoardShapeDefaultIcon({
  draftStyle,
  className,
  width = 24,
  height = 24,
}: {
  draftStyle: ShapeDraftStyle;
  className?: string;
  width?: number;
  height?: number;
}) {
  const shape = useMemo(
    () => createShapeIconPreviewObject(draftStyle, width, height),
    [draftStyle, height, width],
  );

  return (
    <BoardToolIconCanvas
      object={shape}
      renderer={renderShape}
      className={cn("h-6 w-6", className)}
      width={width}
      height={height}
    />
  );
}

export function BoardShapeToolIcon() {
  const store = useBoardEditorContext();
  const toolRegistry = useBoardEditorStore(
    store,
    (state) => state.toolRegistry,
  );
  const toolState = useBoardEditorStore(store, (state) => state.toolState);
  const draftStyle = useMemo(
    () => getShapeToolIconDraftStyle({ toolRegistry, toolState }),
    [toolRegistry, toolState],
  );

  return (
    <BoardShapeDefaultIcon
      draftStyle={draftStyle}
      className="h-6 w-6 overflow-visible"
      width={24}
      height={24}
    />
  );
}

export function getShapeToolIconDraftStyle(
  state: Pick<BoardEditorState, "toolRegistry" | "toolState">,
) {
  const shapeTool = state.toolRegistry.definitions[SHAPE_TOOL_ID];

  if (shapeTool instanceof ShapeTool) {
    return shapeTool.getActivatedDraftStyle(state.toolState);
  }

  return getShapeToolState(state.toolState).draftStyle;
}

export function BoardEquipmentDefinitionIcon({
  definition,
  renderer,
  className,
  size = 24,
}: {
  definition: EquipmentDefinition;
  renderer: CanvasObjectRenderer;
  className?: string;
  size?: number;
}) {
  const iconColor = definition.capabilities?.color
    ? getThemeAwareToolIconColor(definition.color)
    : definition.color;
  const equipment = useMemo(
    () =>
      createEquipmentObject({
        id: "tool-icon-equipment",
        position: { x: 0, y: 0 },
        rotation: 0,
        size: {
          width: definition.defaultSize.width,
          height: definition.defaultSize.height,
        },
        kind: definition.kind,
        color: iconColor,
        definition,
      }),
    [definition, iconColor],
  );

  return (
    <BoardToolIconCanvas
      object={equipment}
      renderer={renderer}
      className={cn("h-6 w-6", className)}
      width={size}
      height={size}
    />
  );
}

export function BoardEquipmentToolIcon({
  definitions,
  renderer,
}: {
  definitions: EquipmentDefinition[];
  renderer: CanvasObjectRenderer;
}) {
  const store = useBoardEditorContext();
  const kind = useBoardEditorStore(
    store,
    (state) => getEquipmentToolState(state.toolState).draftStyle.kind,
  );
  const definition = useMemo(
    () =>
      definitions.find((item) => item.kind === kind) ??
      definitions[0] ??
      undefined,
    [definitions, kind],
  );

  if (!definition) {
    return null;
  }

  return (
    <BoardEquipmentDefinitionIcon definition={definition} renderer={renderer} />
  );
}

function createShapeIconPreviewObject(
  draftStyle: ShapeDraftStyle,
  width: number,
  height: number,
) {
  const inset = 2;
  const left = inset;
  const top = inset;
  const right = width - inset;
  const bottom = height - inset;
  const centerX = (left + right) / 2;
  const shapeWidth = right - left;
  const shapeHeight = bottom - top;
  const triangleHeight = Math.min(
    shapeHeight,
    shapeWidth * EQUILATERAL_TRIANGLE_HEIGHT_RATIO,
  );
  const triangleTop = top + (shapeHeight - triangleHeight) / 2;
  const triangleBottom = triangleTop + triangleHeight;
  const base = {
    id: "shape-icon-preview",
    color: getThemeAwareToolIconColor(draftStyle.color) ?? draftStyle.color,
    strokeWidth: draftStyle.strokeWidth,
    lineStyle: draftStyle.lineStyle,
    dashStyle: draftStyle.dashStyle,
    fillStyle: draftStyle.fillStyle,
    bordered: draftStyle.bordered,
    fillOpacity: draftStyle.fillOpacity,
  };

  switch (draftStyle.kind) {
    case "oval":
      return createShapeObject({
        ...base,
        kind: "oval",
        start: { x: left, y: top },
        end: { x: right, y: bottom },
      });
    case "triangle":
      return createShapeObject({
        ...base,
        kind: "triangle",
        start: { x: left, y: triangleTop },
        end: { x: right, y: triangleBottom },
      });
    case "diamond":
      return createShapeObject({
        ...base,
        kind: "diamond",
        start: { x: left, y: top },
        end: { x: right, y: bottom },
      });
    case "polygon":
      return createShapeObject({
        ...base,
        kind: "polygon",
        points: [
          { x: left, y: top + shapeHeight * 0.82 },
          { x: left + shapeWidth * 0.22, y: top },
          { x: right - shapeWidth * 0.2, y: top + shapeHeight * 0.08 },
          { x: right, y: top + shapeHeight * 0.76 },
          { x: centerX - shapeWidth * 0.14, y: bottom },
        ],
      });
    default:
      return createShapeObject({
        ...base,
        kind: draftStyle.kind as ShapeKind,
        start: { x: left, y: top },
        end: { x: right, y: bottom },
      });
  }
}
