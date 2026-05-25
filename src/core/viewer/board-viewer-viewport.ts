import type {
  Board,
  BoardObject,
  BoardFrameConfig,
  Point,
} from "../board/types";
import {
  ARROW_OBJECT_TYPE,
  getArrowControlPoint,
  type ArrowObject,
} from "../objects/arrow-object";
import {
  getShapePoints,
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../objects/shape-object";
import type { Viewport } from "../geometry/types";
import {
  DEFAULT_VIEWPORT,
  getViewportForZoomAtCanvasPoint,
  VIEWPORT_WHEEL_ZOOM_SENSITIVITY,
} from "../editor/viewport-utils";
import { getFrameFitScale } from "../geometry/frame-scale";

export const DEFAULT_BOARD_VIEWER_FIT_PADDING = 0;

export type BoardViewerViewportMode =
  | "fit"
  | "fit-content"
  | "fixed"
  | "interactive";

export interface BoardViewerCanvasRect {
  width: number;
  height: number;
}

export interface BoardViewerWheelInput {
  canvasRect: BoardViewerCanvasRect;
  clientPoint: Point;
  deltaY: number;
  fitPadding?: number;
}

export interface BoardViewerPanInput {
  delta: Point;
}

type BoardContentBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function expandBoundsToPoint(bounds: BoardContentBounds, point: Point) {
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function expandBoundsToObject(bounds: BoardContentBounds, object: BoardObject) {
  if (object.type === ARROW_OBJECT_TYPE) {
    const arrow = object as ArrowObject;

    expandBoundsToPoint(bounds, arrow.props.start);
    expandBoundsToPoint(bounds, arrow.props.end);
    expandBoundsToPoint(
      bounds,
      arrow.props.controlPoint ??
        getArrowControlPoint(
          arrow.props.start,
          arrow.props.end,
          arrow.props.curveOffset,
        ),
    );
    return;
  }

  if (object.type === SHAPE_OBJECT_TYPE) {
    const shape = object as ShapeObject;

    for (const point of getShapePoints(shape.props)) {
      expandBoundsToPoint(bounds, point);
    }
    return;
  }

  const width = object.size?.width ?? 0;
  const height = object.size?.height ?? object.size?.width ?? 0;

  expandBoundsToPoint(bounds, {
    x: object.position.x - width / 2,
    y: object.position.y - height / 2,
  });
  expandBoundsToPoint(bounds, {
    x: object.position.x + width / 2,
    y: object.position.y + height / 2,
  });
}

function normalizeZero(value: number) {
  return Object.is(value, -0) ? 0 : value;
}

export function getBoardContentBounds(board: Board): BoardContentBounds {
  const bounds = {
    minX: 0,
    minY: 0,
    maxX: board.frame.width,
    maxY: board.frame.height,
  };

  for (const objectId of board.objects.order) {
    const object = board.objects.byId[objectId];

    if (object) {
      expandBoundsToObject(bounds, object);
    }
  }

  return bounds;
}

function getViewportToFitContent({
  board,
  canvasRect,
  fitPadding,
}: {
  board: Board;
  canvasRect: BoardViewerCanvasRect;
  fitPadding: number;
}): Viewport {
  const bounds = getBoardContentBounds(board);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const frame = {
    width: Math.max(1, canvasRect.width - fitPadding * 2),
    height: Math.max(1, canvasRect.height - fitPadding * 2),
  };
  const zoom = getFrameFitScale({ width, height }, frame);
  const boundsCenter = {
    x: bounds.minX + width / 2,
    y: bounds.minY + height / 2,
  };
  const frameCenter = {
    x: board.frame.width / 2,
    y: board.frame.height / 2,
  };

  return {
    pan: {
      x: normalizeZero(-(boundsCenter.x - frameCenter.x) * zoom),
      y: normalizeZero(-(boundsCenter.y - frameCenter.y) * zoom),
    },
    zoom,
  };
}

function getViewerViewportToFitFrame({
  frame,
  canvasRect,
  fitPadding,
}: {
  frame: BoardFrameConfig;
  canvasRect: BoardViewerCanvasRect;
  fitPadding: number;
}): Viewport {
  const viewportFrame = {
    width: Math.max(1, canvasRect.width - fitPadding * 2),
    height: Math.max(1, canvasRect.height - fitPadding * 2),
  };

  return {
    pan: { x: 0, y: 0 },
    zoom: getFrameFitScale(frame, viewportFrame),
  };
}

export function getBoardViewerViewport({
  board,
  mode,
  frame,
  canvasRect,
  viewport,
  fitPadding = DEFAULT_BOARD_VIEWER_FIT_PADDING,
}: {
  board?: Board;
  mode: BoardViewerViewportMode;
  frame: BoardFrameConfig;
  canvasRect: BoardViewerCanvasRect;
  viewport?: Viewport;
  fitPadding?: number;
}): Viewport {
  if (mode === "fit") {
    return getViewerViewportToFitFrame({
      frame,
      canvasRect,
      fitPadding,
    });
  }

  if (mode === "fit-content" && board) {
    return getViewportToFitContent({
      board,
      canvasRect,
      fitPadding,
    });
  }

  if (mode === "fit-content") {
    return getViewerViewportToFitFrame({
      frame,
      canvasRect,
      fitPadding,
    });
  }

  return viewport ?? DEFAULT_VIEWPORT;
}

export function getBoardViewerViewportFromWheel({
  frame,
  viewport,
  input,
}: {
  frame: BoardFrameConfig;
  viewport: Viewport;
  input: BoardViewerWheelInput;
}): Viewport {
  return getViewportForZoomAtCanvasPoint({
    frame,
    viewport,
    canvasRect: input.canvasRect,
    anchorCanvasPoint: input.clientPoint,
    fitPadding: input.fitPadding,
    zoom:
      viewport.zoom * Math.exp(-input.deltaY * VIEWPORT_WHEEL_ZOOM_SENSITIVITY),
  });
}

export function getBoardViewerViewportFromPan({
  viewport,
  input,
}: {
  viewport: Viewport;
  input: BoardViewerPanInput;
}): Viewport {
  return {
    ...viewport,
    pan: {
      x: viewport.pan.x + input.delta.x,
      y: viewport.pan.y + input.delta.y,
    },
  };
}
