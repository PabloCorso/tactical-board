import type {
  DocumentBackgroundConfig,
  DocumentUnit,
  Point,
} from "../board/types";
import { getDocumentCoordinateSystem } from "./document-coordinate-system";
import { getSurfaceBasePixelsPerUnit } from "./surface-scale";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardSurfaceTransform {
  frame: Rect;
  documentUnit: DocumentUnit;
  pixelsPerUnit: number;
  worldOrigin: Point;
  worldToCanvas: (point: Point) => Point;
  canvasToWorld: (point: Point) => Point;
}

export function createBoardSurfaceTransform({
  surface,
  frame,
  zoom = 1,
}: {
  surface: DocumentBackgroundConfig;
  frame: Rect;
  zoom?: number;
}): BoardSurfaceTransform {
  const coordinateSystem = getDocumentCoordinateSystem(surface);
  const worldOrigin = coordinateSystem.origin ?? { x: 0, y: 0 };
  const basePixelsPerUnit = getSurfaceBasePixelsPerUnit(surface, frame);
  const pixelsPerUnit = basePixelsPerUnit * zoom;
  const renderWidth = surface.width * pixelsPerUnit;
  const renderHeight = surface.height * pixelsPerUnit;
  const offsetX = frame.x + (frame.width - renderWidth) / 2;
  const offsetY = frame.y + (frame.height - renderHeight) / 2;

  return {
    frame: {
      x: offsetX,
      y: offsetY,
      width: renderWidth,
      height: renderHeight,
    },
    documentUnit: coordinateSystem.unit,
    pixelsPerUnit,
    worldOrigin,
    worldToCanvas: (point) => ({
      x: offsetX + (point.x - worldOrigin.x) * pixelsPerUnit,
      y: offsetY + (point.y - worldOrigin.y) * pixelsPerUnit,
    }),
    canvasToWorld: (point) => ({
      x: worldOrigin.x + (point.x - offsetX) / pixelsPerUnit,
      y: worldOrigin.y + (point.y - offsetY) / pixelsPerUnit,
    }),
  };
}
