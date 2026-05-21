import { useMemo } from "react";
import {
  createShapeObject,
  type ShapeKind,
} from "../../core/objects/shape-object";
import { useBoardEditorContext } from "../../react/components/board-editor-context";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import { renderShape } from "../../core/tools/shape-tool";
import {
  getShapeToolState,
  type ShapeDraftStyle,
} from "../../core/tools/shape-tool-state";
import { FootballToolIconCanvas } from "./football-tool-icon-canvas";

export function FootballShapePresetIcon({
  draftStyle,
  className = "h-5 w-10",
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
    <FootballToolIconCanvas
      object={shape}
      renderer={renderShape}
      className={className}
      width={width}
      height={height}
    />
  );
}

export function FootballShapeToolIcon() {
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
    <FootballShapePresetIcon
      draftStyle={draftStyle}
      className="h-5 w-5 overflow-visible"
      width={20}
      height={20}
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
