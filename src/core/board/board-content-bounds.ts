import type { Board, BoardFrameMarking, BoardObject, Point } from "./types";
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

export type BoardContentBounds = {
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

function expandBoundsToRect(
  bounds: BoardContentBounds,
  rect: { minX: number; minY: number; maxX: number; maxY: number },
) {
  bounds.minX = Math.min(bounds.minX, rect.minX);
  bounds.minY = Math.min(bounds.minY, rect.minY);
  bounds.maxX = Math.max(bounds.maxX, rect.maxX);
  bounds.maxY = Math.max(bounds.maxY, rect.maxY);
}

function createEmptyBounds(): BoardContentBounds {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
}

function normalizeRadians(angle: number) {
  const fullTurn = Math.PI * 2;
  const normalized = angle % fullTurn;

  return normalized < 0 ? normalized + fullTurn : normalized;
}

function isAngleInClockwiseSweep(angle: number, start: number, end: number) {
  const fullTurn = Math.PI * 2;
  const rawSweep = end - start;

  if (Math.abs(rawSweep) >= fullTurn) {
    return true;
  }

  const normalizedAngle = normalizeRadians(angle);
  const normalizedStart = normalizeRadians(start);
  const normalizedEnd = normalizeRadians(end);
  const sweep =
    normalizedEnd >= normalizedStart
      ? normalizedEnd - normalizedStart
      : fullTurn - normalizedStart + normalizedEnd;
  const offset =
    normalizedAngle >= normalizedStart
      ? normalizedAngle - normalizedStart
      : fullTurn - normalizedStart + normalizedAngle;

  return offset <= sweep;
}

function hasFiniteBounds(bounds: BoardContentBounds) {
  return (
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.minY) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.maxY)
  );
}

function expandBoundsToArcStroke(
  bounds: BoardContentBounds,
  marking: Extract<BoardFrameMarking, { kind: "arc" }>,
  strokeOffset: number,
) {
  const outerRadius = marking.r + strokeOffset;
  const innerRadius = Math.max(0, marking.r - strokeOffset);
  const start = (marking.startAngle * Math.PI) / 180;
  const end = (marking.endAngle * Math.PI) / 180;
  const candidateAngles = [start, end, 0, Math.PI / 2, Math.PI, Math.PI * 1.5];

  for (const angle of candidateAngles) {
    const isEndpoint = angle === start || angle === end;

    if (isEndpoint || isAngleInClockwiseSweep(angle, start, end)) {
      expandBoundsToPoint(bounds, {
        x: marking.cx + Math.cos(angle) * outerRadius,
        y: marking.cy + Math.sin(angle) * outerRadius,
      });

      if (isEndpoint) {
        expandBoundsToPoint(bounds, {
          x: marking.cx + Math.cos(angle) * innerRadius,
          y: marking.cy + Math.sin(angle) * innerRadius,
        });
      }
    }
  }
}

function expandBoundsToMarking(
  bounds: BoardContentBounds,
  marking: BoardFrameMarking,
) {
  const hasStroke = Boolean(marking.stroke && marking.strokeWidth);
  const hasFill = "fill" in marking && Boolean(marking.fill);
  const strokeOffset = hasStroke ? (marking.strokeWidth ?? 0) / 2 : 0;

  switch (marking.kind) {
    case "rect":
      if (!hasFill && !hasStroke) {
        return;
      }

      expandBoundsToRect(bounds, {
        minX: marking.x - strokeOffset,
        minY: marking.y - strokeOffset,
        maxX: marking.x + marking.width + strokeOffset,
        maxY: marking.y + marking.height + strokeOffset,
      });
      return;
    case "line":
      if (!hasStroke) {
        return;
      }

      const dx = marking.x2 - marking.x1;
      const dy = marking.y2 - marking.y1;
      const length = Math.hypot(dx, dy);
      const xStrokeOffset =
        length > 0 ? (Math.abs(dy) / length) * strokeOffset : strokeOffset;
      const yStrokeOffset =
        length > 0 ? (Math.abs(dx) / length) * strokeOffset : strokeOffset;

      expandBoundsToRect(bounds, {
        minX: Math.min(marking.x1, marking.x2) - xStrokeOffset,
        minY: Math.min(marking.y1, marking.y2) - yStrokeOffset,
        maxX: Math.max(marking.x1, marking.x2) + xStrokeOffset,
        maxY: Math.max(marking.y1, marking.y2) + yStrokeOffset,
      });
      return;
    case "circle":
      if (!hasFill && !hasStroke) {
        return;
      }

      expandBoundsToRect(bounds, {
        minX: marking.cx - marking.r - strokeOffset,
        minY: marking.cy - marking.r - strokeOffset,
        maxX: marking.cx + marking.r + strokeOffset,
        maxY: marking.cy + marking.r + strokeOffset,
      });
      return;
    case "arc": {
      if (hasStroke) {
        expandBoundsToArcStroke(bounds, marking, strokeOffset);
      }
      return;
    }
  }
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

export function getBoardContentBounds(board: Board): BoardContentBounds {
  const bounds = board.frame.markings?.length
    ? createEmptyBounds()
    : {
        minX: 0,
        minY: 0,
        maxX: board.frame.width,
        maxY: board.frame.height,
      };

  for (const marking of board.frame.markings ?? []) {
    expandBoundsToMarking(bounds, marking);
  }

  for (const objectId of board.objects.order) {
    const object = board.objects.byId[objectId];

    if (object) {
      expandBoundsToObject(bounds, object);
    }
  }

  if (!hasFiniteBounds(bounds)) {
    return {
      minX: 0,
      minY: 0,
      maxX: board.frame.width,
      maxY: board.frame.height,
    };
  }

  return bounds;
}
