import { useMemo } from "react";
import type { BoardEditorState } from "../../../core/editor/types";
import {
  createShapeObject,
  type ShapeKind,
} from "../../../core/objects/shape-object";
import { renderShape, ShapeTool } from "../../../core/tools/shape-tool";
import {
  getShapeToolState,
  SHAPE_TOOL_ID,
  type ShapeDraftStyle,
} from "../../../core/tools/shape-tool-state";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { cn } from "../../ui/misc";
import { BoardToolIconCanvas } from "./tool-icon-canvas";
import { getThemeAwareToolIconColor } from "./tool-icon-color";

const EQUILATERAL_TRIANGLE_HEIGHT_RATIO = Math.sqrt(3) / 2;

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

  return <BoardShapeDefaultIcon draftStyle={draftStyle} />;
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
