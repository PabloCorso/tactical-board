import { useMemo } from "react";
import type { BoardEditorState } from "../../../core/editor/types";
import { DEFAULT_BOARD_COLOR } from "../../../core/colors/default-colors";
import {
  createEquipmentObject,
  type EquipmentDefinition,
} from "../../../core/objects/equipment-object";
import type { CanvasObjectRenderer } from "../../../core/rendering/canvas/types";
import {
  createPlayerObject,
  PLAYER_OBJECT_TYPE,
} from "../../../core/objects/player-object";
import {
  createShapeObject,
  type ShapeKind,
} from "../../../core/objects/shape-object";
import { BoardEditorArrowIcon } from "../editor/arrow-icon";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { cn } from "../../ui/misc";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { renderPlayer } from "../../../core/tools/player-tool";
import {
  getArrowToolState,
  type ArrowDraftStyle,
} from "../../../core/tools/arrow-tool-state";
import { getEquipmentToolState } from "../../../core/tools/equipment-tool-state";
import {
  getPlayerToolState,
  PLAYER_TOOL_ID,
  type PlayerDraftStyle,
} from "../../../core/tools/player-tool-state";
import { renderShape } from "../../../core/tools/shape-tool";
import {
  getShapeToolState,
  type ShapeDraftStyle,
} from "../../../core/tools/shape-tool-state";
import { BoardToolIconCanvas } from "./tool-icon-canvas";

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

function getCurrentPlayerLabel(
  state: Pick<BoardEditorState, "toolState" | "board">,
  color: string,
) {
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

export function BoardPlayerDefaultIcon({
  draftStyle,
  label,
  className,
  width = 20,
  height = 20,
}: {
  draftStyle: PlayerDraftStyle;
  label: string;
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
      className={cn("h-5 w-5", className)}
      width={width}
      height={height}
    />
  );
}

export function BoardPlayerToolIcon({
  fallbackColor = DEFAULT_BOARD_COLOR.black,
}: {
  fallbackColor?: string;
} = {}) {
  const store = useBoardEditorContext();
  const rawPlayerToolState = useBoardEditorStore(
    store,
    (state) => state.toolState[PLAYER_TOOL_ID],
  );
  const board = useBoardEditorStore(store, (state) => state.board);
  const toolState = useMemo(
    () => ({
      [PLAYER_TOOL_ID]: rawPlayerToolState,
    }),
    [rawPlayerToolState],
  );
  const draftStyle = useMemo(
    () => getPlayerToolState(toolState).draftStyle,
    [toolState],
  );
  const color = draftStyle.color || fallbackColor;
  const label = useMemo(
    () => getCurrentPlayerLabel({ toolState, board }, color),
    [board, color, toolState],
  );

  return <BoardPlayerDefaultIcon draftStyle={draftStyle} label={label} />;
}

export function BoardArrowDefaultIcon({
  draftStyle,
  className,
  width = 40,
  height = 20,
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
  return (
    <BoardEditorArrowIcon
      draftStyle={draftStyle}
      className={cn("h-5 w-10", className)}
      width={width}
      height={height}
      layout="wide"
    />
  );
}

export function BoardArrowToolIcon() {
  const store = useBoardEditorContext();
  const rawArrowToolState = useBoardEditorStore(
    store,
    (state) => state.toolState.arrow,
  );
  const draftStyle = useMemo(
    () => getArrowToolState({ arrow: rawArrowToolState }).draftStyle,
    [rawArrowToolState],
  );

  return (
    <BoardEditorArrowIcon
      draftStyle={draftStyle}
      className="h-5 w-5 overflow-visible"
      width={20}
      height={20}
      layout="compact"
    />
  );
}

export function BoardShapeDefaultIcon({
  draftStyle,
  className,
  width = 40,
  height = 20,
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
      className={cn("h-5 w-10", className)}
      width={width}
      height={height}
    />
  );
}

export function BoardShapeToolIcon() {
  const store = useBoardEditorContext();
  const rawShapeToolState = useBoardEditorStore(
    store,
    (state) => state.toolState.shape,
  );
  const draftStyle = useMemo(
    () => getShapeToolState({ shape: rawShapeToolState }).draftStyle,
    [rawShapeToolState],
  );

  return (
    <BoardShapeDefaultIcon
      draftStyle={draftStyle}
      className="h-5 w-5 overflow-visible"
      width={20}
      height={20}
    />
  );
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
        color: definition.color,
        definition,
      }),
    [definition],
  );

  return (
    <BoardToolIconCanvas
      object={equipment}
      renderer={renderer}
      className={cn("h-5 w-5", className)}
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
    <BoardEquipmentDefinitionIcon
      definition={definition}
      renderer={renderer}
    />
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
  const base = {
    id: "shape-icon-preview",
    color: draftStyle.color,
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
        start: { x: left, y: top },
        end: { x: right, y: bottom },
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
