import { useMemo } from "react";
import { createShapeObject, type ShapeKind } from "../../core/objects/shape-object";
import { useBoardEditorContext } from "../../react/components/board-editor-context";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import { renderShape } from "../../tools/shape-tool";
import { getShapeToolState, type ShapeDraftStyle } from "../../tools/shape-tool-state";
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
  const shape = useMemo(() => createShapeIconPreviewObject(draftStyle), [draftStyle]);

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

function createShapeIconPreviewObject(draftStyle: ShapeDraftStyle) {
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
        start: { x: 0.75, y: 0.8 },
        end: { x: 5.25, y: 3.2 },
      });
    case "triangle":
      return createShapeObject({
        ...base,
        kind: "triangle",
        start: { x: 1.1, y: 0.8 },
        end: { x: 4.9, y: 3.2 },
      });
    case "diamond":
      return createShapeObject({
        ...base,
        kind: "diamond",
        start: { x: 1.1, y: 0.8 },
        end: { x: 4.9, y: 3.2 },
      });
    case "polygon":
      return createShapeObject({
        ...base,
        kind: "polygon",
        points: [
          { x: 1.1, y: 2.8 },
          { x: 1.9, y: 0.8 },
          { x: 4.1, y: 1.0 },
          { x: 4.9, y: 2.7 },
          { x: 2.4, y: 3.2 },
        ],
      });
    default:
      return createShapeObject({
        ...base,
        kind: draftStyle.kind as ShapeKind,
        start: { x: 0.95, y: 0.9 },
        end: { x: 5.05, y: 3.1 },
      });
  }
}
