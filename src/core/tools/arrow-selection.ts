import colors from "tailwindcss/colors";
import {
  ARROW_OBJECT_TYPE,
  getArrowBodyStrokeWidth,
  getArrowBodyPolylines,
  getArrowControlPoint,
  getArrowCurveHandlePoint,
  getArrowCurveOffsetFromHandlePoint,
  setArrowCurveOffset,
  setArrowEndpoint,
  type ArrowHeadStyle,
  type ArrowObject,
} from "../objects/arrow-object";
import type {
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "../objects/object-selection";
import { SELECTION_TOOLBAR_OFFSET_PX } from "./selection-geometry";
import {
  getArrowHeadLength,
  getScaledCanvasStrokeWidth,
} from "../rendering/canvas/object-render-scale";

const ARROW_ENDPOINT_HANDLE_RADIUS_PX = 4;
const ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX = 12;
const ARROW_CURVE_HANDLE_WIDTH_PX = 16;
const ARROW_CURVE_HANDLE_HEIGHT_PX = 5;
type ArrowSelectionSession = ObjectSelectionSession & {
  kind: "endpoint" | "curve";
  endpoint?: "start" | "end";
};

const ARROW_HEAD_SPREAD = Math.PI / 7;

function getArrowHeadBodyInset(strokeWidth: number) {
  return getArrowHeadLength(strokeWidth) * Math.cos(ARROW_HEAD_SPREAD);
}

function offsetPointToward(
  point: { x: number; y: number },
  target: { x: number; y: number },
  distance: number,
) {
  const dx = target.x - point.x;
  const dy = target.y - point.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return point;
  }

  const clampedDistance = Math.min(distance, length);

  return {
    x: point.x + (dx / length) * clampedDistance,
    y: point.y + (dy / length) * clampedDistance,
  };
}

function getArrowHeadCanvasPoints(input: {
  tip: { x: number; y: number };
  tail: { x: number; y: number };
  strokeWidth: number;
  headStyle: ArrowHeadStyle;
}) {
  const { tip, tail, strokeWidth, headStyle } = input;

  if (headStyle === "none") {
    return [];
  }

  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const headLength = getArrowHeadLength(strokeWidth);

  return [
    tip,
    {
      x: tip.x - Math.cos(angle - ARROW_HEAD_SPREAD) * headLength,
      y: tip.y - Math.sin(angle - ARROW_HEAD_SPREAD) * headLength,
    },
    {
      x: tip.x - Math.cos(angle + ARROW_HEAD_SPREAD) * headLength,
      y: tip.y - Math.sin(angle + ARROW_HEAD_SPREAD) * headLength,
    },
  ];
}

export function getArrowSelectionCanvasBounds(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<ArrowObject>["renderSelection"]>
  >[0]["projection"],
  arrow: ArrowObject,
) {
  const styleScale =
    "zoom" in projection && typeof projection.zoom === "number"
      ? projection.zoom
      : 1;
  const strokeWidth = getScaledCanvasStrokeWidth(
    arrow.props.strokeWidth,
    projection.scale,
  );
  const bodyStrokeWidth = getArrowBodyStrokeWidth(
    strokeWidth,
    arrow.props.kind,
  );
  const startCanvas = projection.boardToCanvas(arrow.props.start);
  const endCanvas = projection.boardToCanvas(arrow.props.end);
  const controlCanvas =
    arrow.props.kind === "curved"
      ? projection.boardToCanvas(
          getArrowControlPoint(
            arrow.props.start,
            arrow.props.end,
            arrow.props.curveOffset,
          ),
        )
      : undefined;
  const startTangent = controlCanvas ?? endCanvas;
  const endTangent = controlCanvas ?? startCanvas;
  const pathStart =
    arrow.props.startHead === "none"
      ? startCanvas
      : offsetPointToward(
          startCanvas,
          startTangent,
          getArrowHeadBodyInset(strokeWidth),
        );
  const pathEnd =
    arrow.props.endHead === "none"
      ? endCanvas
      : offsetPointToward(
          endCanvas,
          endTangent,
          getArrowHeadBodyInset(strokeWidth),
        );
  const headPoints = [
    ...getArrowHeadCanvasPoints({
      tip: startCanvas,
      tail: startTangent,
      strokeWidth,
      headStyle: arrow.props.startHead,
    }),
    ...getArrowHeadCanvasPoints({
      tip: endCanvas,
      tail: endTangent,
      strokeWidth,
      headStyle: arrow.props.endHead,
    }),
  ];
  const bodyPoints = getArrowBodyPolylines({
    start: pathStart,
    end: pathEnd,
    controlPoint: arrow.props.kind === "curved" ? controlCanvas : undefined,
    kind: arrow.props.kind,
    styleScale,
  }).flat();
  const points = [...bodyPoints, ...headPoints];
  const padding = Math.max(bodyStrokeWidth / 2, 1);

  return {
    left: Math.min(...points.map((point) => point.x)) - padding,
    right: Math.max(...points.map((point) => point.x)) + padding,
    top: Math.min(...points.map((point) => point.y)) - padding,
    bottom: Math.max(...points.map((point) => point.y)) + padding,
  };
}

export const arrowSelectionAdapter: ObjectSelectionAdapter<
  ArrowObject,
  ArrowSelectionSession
> = {
  getCanvasBounds: ({ object, projection }) =>
    getArrowSelectionCanvasBounds(projection, object),
  renderSelection: ({ context, object, projection, color }) => {
    const startPoint = projection.boardToCanvas(object.props.start);
    const endPoint = projection.boardToCanvas(object.props.end);

    context.save();
    context.fillStyle = colors.white;
    context.strokeStyle = color;
    context.lineWidth = 1.5;

    for (const point of [object.props.start, object.props.end].map((endpoint) =>
      projection.boardToCanvas(endpoint),
    )) {
      context.beginPath();
      context.arc(
        point.x,
        point.y,
        ARROW_ENDPOINT_HANDLE_RADIUS_PX,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.stroke();
    }

    if (object.props.kind === "curved") {
      const handlePoint = projection.boardToCanvas(
        getArrowCurveHandlePoint(
          object.props.start,
          object.props.end,
          object.props.curveOffset,
        ),
      );
      const angle = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x,
      );

      context.save();
      context.translate(handlePoint.x, handlePoint.y);
      context.rotate(angle);
      context.beginPath();
      context.roundRect(
        -ARROW_CURVE_HANDLE_WIDTH_PX / 2,
        -ARROW_CURVE_HANDLE_HEIGHT_PX / 2,
        ARROW_CURVE_HANDLE_WIDTH_PX,
        ARROW_CURVE_HANDLE_HEIGHT_PX,
        ARROW_CURVE_HANDLE_HEIGHT_PX / 2,
      );
      context.fill();
      context.stroke();
      context.restore();
    }

    context.restore();
  },
  hitSelectionHandle: ({ object, projection, event }) => {
    if (object.type !== ARROW_OBJECT_TYPE || object.locked) {
      return undefined;
    }

    const canvasPoint = projection.boardToCanvas(event.point);

    const startCanvasPoint = projection.boardToCanvas(object.props.start);
    const endCanvasPoint = projection.boardToCanvas(object.props.end);
    const endpointHitRadius = Math.min(
      ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX,
      Math.max(
        ARROW_ENDPOINT_HANDLE_RADIUS_PX,
        Math.hypot(
          startCanvasPoint.x - endCanvasPoint.x,
          startCanvasPoint.y - endCanvasPoint.y,
        ) /
          2 -
          0.001,
      ),
    );
    const endpointHits = [
      { endpoint: "start" as const, point: startCanvasPoint },
      { endpoint: "end" as const, point: endCanvasPoint },
    ]
      .map(({ endpoint, point }) => ({
        endpoint,
        distance: Math.hypot(canvasPoint.x - point.x, canvasPoint.y - point.y),
      }))
      .filter(({ distance }) => distance <= endpointHitRadius)
      .sort((left, right) => left.distance - right.distance);
    const endpointHit = endpointHits[0];

    if (endpointHit) {
      return {
        kind: "endpoint",
        endpoint: endpointHit.endpoint,
      };
    }

    if (object.props.kind !== "curved") {
      return undefined;
    }

    const handlePoint = projection.boardToCanvas(
      getArrowCurveHandlePoint(
        object.props.start,
        object.props.end,
        object.props.curveOffset,
      ),
    );
    const startPoint = projection.boardToCanvas(object.props.start);
    const endPoint = projection.boardToCanvas(object.props.end);
    const angle = Math.atan2(
      endPoint.y - startPoint.y,
      endPoint.x - startPoint.x,
    );
    const dx = canvasPoint.x - handlePoint.x;
    const dy = canvasPoint.y - handlePoint.y;
    const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
    const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);

    if (
      Math.abs(localX) <= ARROW_CURVE_HANDLE_WIDTH_PX / 2 + 2 &&
      Math.abs(localY) <= ARROW_CURVE_HANDLE_HEIGHT_PX / 2
    ) {
      return { kind: "curve" };
    }

    return undefined;
  },
  updateSelectionInteraction: ({ object, session, event }) => {
    switch (session.kind) {
      case "endpoint":
        return setArrowEndpoint(object, session.endpoint ?? "end", event.point);
      case "curve":
        return setArrowCurveOffset(
          object,
          getArrowCurveOffsetFromHandlePoint(
            object.props.start,
            object.props.end,
            event.point,
          ),
        );
    }
  },
  getToolbarAnchor: ({ object, projection }) => {
    const start = projection.boardToCanvas(object.props.start);
    const end = projection.boardToCanvas(object.props.end);
    const controlPoint =
      object.props.kind === "curved"
        ? projection.boardToCanvas(
            getArrowCurveHandlePoint(
              object.props.start,
              object.props.end,
              object.props.curveOffset,
            ),
          )
        : undefined;

    return {
      left: controlPoint
        ? (start.x + end.x + controlPoint.x) / 3
        : (start.x + end.x) / 2,
      top:
        Math.min(start.y, end.y, controlPoint?.y ?? Number.POSITIVE_INFINITY) -
        SELECTION_TOOLBAR_OFFSET_PX,
    };
  },
};
