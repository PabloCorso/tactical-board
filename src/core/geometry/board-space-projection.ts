import type { BoardObject, BoardSurfaceConfig, Point } from "../board/types";
import { createBoardSurfaceTransform } from "./create-board-surface-transform";
import type { Rect, Viewport } from "./types";

const DEFAULT_SURFACE_INSET = 14;
const DEFAULT_OBJECT_DIAMETER = 1.8;
const DEFAULT_MINIMUM_HIT_RADIUS_PX = 24;

export interface BoardSpaceProjection {
  frame: Rect;
  pixelsPerUnit: number;
  worldOrigin: Point;
  worldToCanvas: (point: Point) => Point;
  canvasToWorld: (point: Point) => Point;
  getObjectCanvasRadius: (object: BoardObject) => number;
  getObjectCanvasBounds: (object: BoardObject) => Rect;
  hitTestObject: (
    object: BoardObject,
    canvasPoint: Point,
    options?: { minimumHitRadiusPx?: number },
  ) => boolean;
}

export interface CreateBoardSpaceProjectionOptions {
  surface: BoardSurfaceConfig;
  viewport: Viewport;
  canvasRect: Pick<Rect, "width" | "height">;
  surfaceInset?: number;
}

export function createBoardSpaceProjection({
  surface,
  viewport,
  canvasRect,
  surfaceInset = DEFAULT_SURFACE_INSET,
}: CreateBoardSpaceProjectionOptions): BoardSpaceProjection {
  const surfaceTransform = createBoardSurfaceTransform({
    surface,
    frame: {
      x: surfaceInset + viewport.pan.x,
      y: surfaceInset + viewport.pan.y,
      width: canvasRect.width - surfaceInset * 2,
      height: canvasRect.height - surfaceInset * 2,
    },
  });

  const getObjectCanvasSize = (object: BoardObject) => {
    const width = object.size?.width ?? DEFAULT_OBJECT_DIAMETER;
    const height =
      object.size?.height ?? object.size?.width ?? DEFAULT_OBJECT_DIAMETER;

    if (object.size?.mode === "screen") {
      return { width, height };
    }

    return {
      width: width * surfaceTransform.pixelsPerUnit,
      height: height * surfaceTransform.pixelsPerUnit,
    };
  };

  const getObjectCanvasRadius = (object: BoardObject) => {
    const { width } = getObjectCanvasSize(object);
    return width / 2;
  };

  const getObjectCanvasBounds = (object: BoardObject): Rect => {
    const center = surfaceTransform.worldToCanvas(object.position);
    const { width, height } = getObjectCanvasSize(object);

    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
    };
  };

  return {
    frame: surfaceTransform.frame,
    pixelsPerUnit: surfaceTransform.pixelsPerUnit,
    worldOrigin: surfaceTransform.worldOrigin,
    worldToCanvas: surfaceTransform.worldToCanvas,
    canvasToWorld: surfaceTransform.canvasToWorld,
    getObjectCanvasRadius,
    getObjectCanvasBounds,
    hitTestObject: (object, canvasPoint, options) => {
      const center = surfaceTransform.worldToCanvas(object.position);
      const radius = Math.max(
        getObjectCanvasRadius(object),
        options?.minimumHitRadiusPx ?? DEFAULT_MINIMUM_HIT_RADIUS_PX,
      );

      return (
        Math.hypot(canvasPoint.x - center.x, canvasPoint.y - center.y) <= radius
      );
    },
  };
}
