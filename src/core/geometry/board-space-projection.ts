import type {
  BoardObject,
  DocumentBackgroundConfig,
  Point,
} from "../board/types";
import { createBoardFrameTransform } from "./create-board-frame-transform";
import type { FitPadding, Rect, Viewport } from "./types";
import { getFitPaddingInsets } from "./fit-padding";

const DEFAULT_OBJECT_DIAMETER = 18;
const DEFAULT_MINIMUM_HIT_RADIUS_PX = 24;

export interface BoardSpaceProjection {
  frame: Rect;
  zoom: number;
  scale: number;
  boardToCanvas: (point: Point) => Point;
  canvasToBoard: (point: Point) => Point;
  getObjectCanvasRadius: (object: BoardObject) => number;
  getObjectCanvasBounds: (object: BoardObject) => Rect;
  hitTestObject: (
    object: BoardObject,
    canvasPoint: Point,
    options?: { minimumHitRadiusPx?: number },
  ) => boolean;
}

export interface CreateBoardSpaceProjectionOptions {
  frame: DocumentBackgroundConfig;
  viewport: Viewport;
  canvasRect: Pick<Rect, "width" | "height">;
  fitPadding?: FitPadding;
}

export function createBoardSpaceProjection({
  frame,
  viewport,
  canvasRect,
  fitPadding,
}: CreateBoardSpaceProjectionOptions): BoardSpaceProjection {
  const padding = getFitPaddingInsets(fitPadding);
  const viewportFrameWidth = Math.max(
    1,
    canvasRect.width - padding.left - padding.right,
  );
  const viewportFrameHeight = Math.max(
    1,
    canvasRect.height - padding.top - padding.bottom,
  );
  const frameTransform = createBoardFrameTransform({
    boardFrame: frame,
    viewportFrame: {
      x: padding.left + viewport.pan.x,
      y: padding.top + viewport.pan.y,
      width: viewportFrameWidth,
      height: viewportFrameHeight,
    },
    zoom: viewport.zoom,
  });

  const getObjectCanvasSize = (object: BoardObject) => {
    const width = object.size?.width ?? DEFAULT_OBJECT_DIAMETER;
    const height =
      object.size?.height ?? object.size?.width ?? DEFAULT_OBJECT_DIAMETER;

    return {
      width: width * frameTransform.scale,
      height: height * frameTransform.scale,
    };
  };

  const getObjectCanvasRadius = (object: BoardObject) => {
    const { width } = getObjectCanvasSize(object);
    return width / 2;
  };

  const getObjectCanvasBounds = (object: BoardObject): Rect => {
    const center = frameTransform.boardToCanvas(object.position);
    const { width, height } = getObjectCanvasSize(object);

    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
    };
  };

  return {
    frame: frameTransform.frame,
    zoom: viewport.zoom,
    scale: frameTransform.scale,
    boardToCanvas: frameTransform.boardToCanvas,
    canvasToBoard: frameTransform.canvasToBoard,
    getObjectCanvasRadius,
    getObjectCanvasBounds,
    hitTestObject: (object, canvasPoint, options) => {
      const center = frameTransform.boardToCanvas(object.position);
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
