import type {
  BoardFrameConfig,
  BoardFrameOrientation,
  BoardObject,
  Point,
} from "./types";
import {
  ARROW_OBJECT_TYPE,
  updateArrowObject,
  type ArrowObject,
} from "../objects/arrow-object";
import {
  SHAPE_OBJECT_TYPE,
  updateShapeObject,
  type ShapeObject,
} from "../objects/shape-object";

export type FrameObjectRemapContext = {
  object: BoardObject;
  previousFrame: BoardFrameConfig;
  nextFrame: BoardFrameConfig;
  rotateObject?: boolean;
};

function remapCoordinate(
  value: number,
  previousSize: number,
  nextSize: number,
) {
  if (Math.abs(previousSize) < 1e-6) {
    return nextSize / 2;
  }

  return (value / previousSize) * nextSize;
}

function remapPoint(
  point: Point,
  previousFrame: BoardFrameConfig,
  nextFrame: BoardFrameConfig,
): Point {
  return {
    x: remapCoordinate(point.x, previousFrame.width, nextFrame.width),
    y: remapCoordinate(point.y, previousFrame.height, nextFrame.height),
  };
}

function getFrameScale(previousSize: number, nextSize: number) {
  if (Math.abs(previousSize) < 1e-6) {
    return 1;
  }

  return nextSize / previousSize;
}

function addRotation(rotation: number | undefined, rotationDelta: number) {
  if (rotation === undefined) {
    return undefined;
  }

  const nextRotation = (rotation + rotationDelta) % 360;
  return nextRotation < 0 ? nextRotation + 360 : nextRotation;
}

function remapCurveOffset(
  curveOffset: number | undefined,
  previousFrame: BoardFrameConfig,
  nextFrame: BoardFrameConfig,
) {
  if (curveOffset === undefined) {
    return undefined;
  }

  return (
    curveOffset *
    ((getFrameScale(previousFrame.width, nextFrame.width) +
      getFrameScale(previousFrame.height, nextFrame.height)) /
      2)
  );
}

function remapObjectPoints(
  object: BoardObject,
  remapPoint: (point: Point) => Point,
  remapCurveOffsetValue: (
    curveOffset: number | undefined,
  ) => number | undefined,
  rotationDelta = 0,
): BoardObject {
  if (object.type === ARROW_OBJECT_TYPE) {
    const arrow = object as ArrowObject;

    return updateArrowObject(arrow, {
      start: remapPoint(arrow.props.start),
      end: remapPoint(arrow.props.end),
      curveOffset: remapCurveOffsetValue(arrow.props.curveOffset),
    });
  }

  if (object.type === SHAPE_OBJECT_TYPE) {
    const shape = object as ShapeObject;
    const nextShape = updateShapeObject(shape, {
      start: shape.props.start ? remapPoint(shape.props.start) : undefined,
      end: shape.props.end ? remapPoint(shape.props.end) : undefined,
      points: shape.props.points?.map(remapPoint),
    });

    return {
      ...nextShape,
      rotation: addRotation(nextShape.rotation, rotationDelta),
    };
  }

  return {
    ...object,
    position: remapPoint(object.position),
    rotation: addRotation(object.rotation, rotationDelta),
  };
}

export function remapObjectToFrameSize({
  object,
  previousFrame,
  nextFrame,
}: FrameObjectRemapContext): BoardObject {
  if (
    previousFrame.width === nextFrame.width &&
    previousFrame.height === nextFrame.height
  ) {
    return object;
  }

  return remapObjectPoints(
    object,
    (point) => remapPoint(point, previousFrame, nextFrame),
    (curveOffset) => remapCurveOffset(curveOffset, previousFrame, nextFrame),
  );
}

function getOrientation(value: BoardFrameConfig["orientation"]) {
  return value ?? 0;
}

function getCanonicalFrameSize(frame: BoardFrameConfig) {
  const orientation = getOrientation(frame.orientation);

  if (orientation === 90 || orientation === 270) {
    return {
      width: frame.height,
      height: frame.width,
    };
  }

  return {
    width: frame.width,
    height: frame.height,
  };
}

function orientedPointToCanonical(
  point: Point,
  canonicalSize: { width: number; height: number },
  orientation: BoardFrameOrientation,
): Point {
  switch (orientation) {
    case 90:
      return { x: canonicalSize.width - point.y, y: point.x };
    case 180:
      return {
        x: canonicalSize.width - point.x,
        y: canonicalSize.height - point.y,
      };
    case 270:
      return { x: point.y, y: canonicalSize.height - point.x };
    case 0:
      return point;
  }
}

function canonicalPointToOriented(
  point: Point,
  canonicalSize: { width: number; height: number },
  orientation: BoardFrameOrientation,
): Point {
  switch (orientation) {
    case 90:
      return { x: point.y, y: canonicalSize.width - point.x };
    case 180:
      return {
        x: canonicalSize.width - point.x,
        y: canonicalSize.height - point.y,
      };
    case 270:
      return { x: canonicalSize.height - point.y, y: point.x };
    case 0:
      return point;
  }
}

export function remapObjectToFrameRotation({
  object,
  previousFrame,
  nextFrame,
  rotateObject = false,
}: FrameObjectRemapContext): BoardObject {
  const previousOrientation = getOrientation(previousFrame.orientation);
  const nextOrientation = getOrientation(nextFrame.orientation);

  if (previousOrientation === nextOrientation) {
    return object;
  }

  const canonicalSize = getCanonicalFrameSize(previousFrame);
  const rotationDelta = rotateObject
    ? previousOrientation - nextOrientation
    : 0;

  return remapObjectPoints(
    object,
    (point) =>
      canonicalPointToOriented(
        orientedPointToCanonical(point, canonicalSize, previousOrientation),
        canonicalSize,
        nextOrientation,
      ),
    (curveOffset) => curveOffset,
    rotationDelta,
  );
}
