import { useMemo } from "react";
import {
  createArrowObject,
  type ArrowObject,
} from "../../core/objects/arrow-object";
import type { BoardSpaceProjection } from "../../core/geometry/board-space-projection";
import { useBoardEditorContext } from "../../react/components/board-editor-context";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import { renderArrow } from "../../tools/arrow-tool";
import {
  getArrowToolState,
  type ArrowDraftStyle,
} from "../../tools/arrow-tool-state";
import { FootballToolIconCanvas } from "./football-tool-icon-canvas";

const ARROW_ICON_WORLD_WIDTH = 8;
const ARROW_ICON_WORLD_HEIGHT = 4;
const ARROW_ICON_INSET = 1.5;

export function FootballArrowPresetIcon({
  draftStyle,
  className = "h-5 w-10",
  width = 40,
  height = 20,
}: {
  draftStyle: Pick<
    ArrowDraftStyle,
    | "geometry"
    | "bodyStyle"
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
  const previewArrow = useMemo(
    () => createArrowIconPreviewObject(draftStyle),
    [draftStyle],
  );

  return (
    <FootballToolIconCanvas
      object={previewArrow}
      renderer={renderArrow}
      className={className}
      width={width}
      height={height}
      createProjection={createArrowIconProjection}
    />
  );
}

export function FootballArrowToolIcon() {
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
    <FootballArrowPresetIcon
      draftStyle={draftStyle}
      className="h-5 w-5 overflow-visible"
      width={20}
      height={20}
    />
  );
}

function createArrowIconPreviewObject(
  draftStyle: Pick<
    ArrowDraftStyle,
    | "geometry"
    | "bodyStyle"
    | "color"
    | "strokeWidth"
    | "lineStyle"
    | "dashStyle"
    | "startHead"
    | "endHead"
  >,
): ArrowObject {
  const base = {
    id: "arrow-icon-preview",
    ...draftStyle,
  };

  if (draftStyle.geometry === "polyline") {
    return createArrowObject({
      ...base,
      points: [
        { x: 1.0, y: 3.15 },
        { x: 2.7, y: 3.15 },
        { x: 2.7, y: 1.3 },
        { x: 6.9, y: 1.3 },
      ],
    });
  }

  const sharedGeometry = {
    start: { x: 1.0, y: 2.95 },
    end: { x: 6.9, y: 1.05 },
  };

  return createArrowObject({
    ...base,
    ...sharedGeometry,
    curveOffset: draftStyle.bodyStyle === "curved" ? -2.2 : undefined,
  });
}

function createArrowIconProjection(
  _arrow: ArrowObject,
  width: number,
  height: number,
): BoardSpaceProjection {
  const left = 0;
  const top = 0;
  const usableWidth = Math.max(width - ARROW_ICON_INSET * 2, 1);
  const usableHeight = Math.max(height - ARROW_ICON_INSET * 2, 1);
  const scale = Math.min(
    usableWidth / ARROW_ICON_WORLD_WIDTH,
    usableHeight / ARROW_ICON_WORLD_HEIGHT,
  );
  const offsetX =
    ARROW_ICON_INSET + (usableWidth - ARROW_ICON_WORLD_WIDTH * scale) / 2;
  const offsetY =
    ARROW_ICON_INSET + (usableHeight - ARROW_ICON_WORLD_HEIGHT * scale) / 2;

  const worldToCanvas = (point: { x: number; y: number }) => ({
    x: (point.x - left) * scale + offsetX,
    y: (point.y - top) * scale + offsetY,
  });

  return {
    frame: { x: 0, y: 0, width, height },
    zoom: scale,
    pixelsPerUnit: scale,
    worldOrigin: { x: left, y: top },
    worldToCanvas,
    canvasToWorld: (point) => ({
      x: (point.x - offsetX) / scale + left,
      y: (point.y - offsetY) / scale + top,
    }),
    getObjectCanvasRadius: (object) => ((object.size?.width ?? 0) * scale) / 2,
    getObjectCanvasBounds: (object) => {
      const canvasCenter = worldToCanvas(object.position);
      const objectWidth = (object.size?.width ?? 0) * scale;
      const objectHeight =
        (object.size?.height ?? object.size?.width ?? 0) * scale;

      return {
        x: canvasCenter.x - objectWidth / 2,
        y: canvasCenter.y - objectHeight / 2,
        width: objectWidth,
        height: objectHeight,
      };
    },
    hitTestObject: () => false,
  };
}
