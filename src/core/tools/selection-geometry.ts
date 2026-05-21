import type { Point } from "../board/types";

const ROTATE_HANDLE_ICON_COLOR = "#111827";
export const SELECTION_TOOLBAR_OFFSET_PX = 56;

let rotateHandleIconPathCache: Path2D | null | undefined;

export function rotateOffset(x: number, y: number, rotation = 0) {
  const angle = (rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

export function getRotatedRectBoardPoints({
  center,
  width,
  height,
  rotation = 0,
}: {
  center: Point;
  width: number;
  height: number;
  rotation?: number;
}) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];

  return corners.map((corner) => {
    const offset = rotateOffset(corner.x, corner.y, rotation);

    return {
      x: center.x + offset.x,
      y: center.y + offset.y,
    };
  });
}

export function drawClosedCanvasPath(
  context: CanvasRenderingContext2D,
  points: Point[],
) {
  if (points.length === 0) {
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y);
  }

  context.closePath();
}

export function drawRoundedSquareHandle(
  context: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  cornerRadius = 2,
) {
  const size = radius * 2;

  context.beginPath();
  context.roundRect(
    point.x - radius,
    point.y - radius,
    size,
    size,
    Math.min(cornerRadius, radius),
  );
}

export function getExpandedCanvasRectPoints(
  points: Point[],
  paddingPx: number,
) {
  if (points.length !== 4) {
    return points;
  }

  const center = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x / points.length,
      y: accumulator.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  );

  return points.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const length = Math.hypot(dx, dy) || 1;

    return {
      x: point.x + (dx / length) * paddingPx,
      y: point.y + (dy / length) * paddingPx,
    };
  });
}

export function getBoundsFromCanvasPoints(points: Point[]) {
  return {
    left: Math.min(...points.map((point) => point.x)),
    right: Math.max(...points.map((point) => point.x)),
    top: Math.min(...points.map((point) => point.y)),
    bottom: Math.max(...points.map((point) => point.y)),
  };
}

export function getCornerHandleCanvasPoint(
  outlinePoints: Point[],
  cornerIndex: number,
  offsetPx = 0,
) {
  const corner = outlinePoints[cornerIndex];

  if (!corner || offsetPx === 0) {
    return corner;
  }

  const center = outlinePoints.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x / outlinePoints.length,
      y: accumulator.y + point.y / outlinePoints.length,
    }),
    { x: 0, y: 0 },
  );
  const dx = corner.x - center.x;
  const dy = corner.y - center.y;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: corner.x + (dx / length) * offsetPx,
    y: corner.y + (dy / length) * offsetPx,
  };
}

export function getTopAnchorFromSelectionChrome(
  outlinePoints: Point[],
  rotateHandlePoint: Point | undefined,
  rotateHandleRadiusPx: number,
) {
  return Math.min(
    ...outlinePoints.map((point) => point.y),
    rotateHandlePoint
      ? rotateHandlePoint.y - rotateHandleRadiusPx
      : Number.POSITIVE_INFINITY,
  );
}

export function getSelectionToolbarAnchorFromSelectionChrome({
  left,
  outlinePoints,
  rotateHandlePoint,
  rotateHandleRadiusPx = 0,
}: {
  left: number;
  outlinePoints: Point[];
  rotateHandlePoint?: Point;
  rotateHandleRadiusPx?: number;
}) {
  return {
    left,
    top:
      getTopAnchorFromSelectionChrome(
        outlinePoints,
        rotateHandlePoint,
        rotateHandleRadiusPx,
      ) - SELECTION_TOOLBAR_OFFSET_PX,
  };
}

export function rotatePointAround(point: Point, center: Point, rotation = 0) {
  const angle = (rotation * Math.PI) / 180;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function getRotationFromPointer(
  center: Point,
  point: Point,
  initialRotation: number,
  initialPointerAngle: number,
) {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  if (dx === 0 && dy === 0) {
    return initialRotation;
  }

  const currentPointerAngle = Math.atan2(dy, dx);
  return (
    initialRotation +
    ((currentPointerAngle - initialPointerAngle) * 180) / Math.PI
  );
}

export function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    ),
  );
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

export function renderRotateHandleIcon(
  context: CanvasRenderingContext2D,
  point: { x: number; y: number },
  radius: number,
  rotation = 0,
) {
  if (rotateHandleIconPathCache === undefined) {
    rotateHandleIconPathCache =
      typeof Path2D === "undefined"
        ? null
        : new Path2D(
            "M188.4,192a88,88,0,1,1,1.83-126.23L232,104 M184,104H232V56",
          );
  }

  context.save();
  context.translate(point.x, point.y);
  context.rotate((rotation * Math.PI) / 180);
  context.strokeStyle = ROTATE_HANDLE_ICON_COLOR;
  context.lineCap = "round";
  context.lineJoin = "round";
  const scale = (radius * 1.5) / 256;
  context.scale(scale, scale);
  context.lineWidth = 2 / scale;
  context.translate(-128, -128);

  if (rotateHandleIconPathCache) {
    context.stroke(rotateHandleIconPathCache);
  } else {
    context.beginPath();
    context.moveTo(184, 104);
    context.lineTo(232, 104);
    context.lineTo(232, 56);
    context.stroke();
  }

  context.restore();
}
