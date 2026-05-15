import colors from "tailwindcss/colors";
import {
  ARROW_OBJECT_TYPE,
  getArrowCurveHandlePoint,
  getArrowCurveOffsetFromHandlePoint,
  getArrowPolylinePoints,
  setArrowCurveOffset,
  setArrowEndpoint,
  setArrowPolylinePoint,
  type ArrowObject,
} from "../core/objects/arrow-object";
import type {
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "../core/objects/object-selection";
import { BoardEditorArrowSelectionToolbar } from "../react/components/board-editor-selection-toolbar-arrow";
import { SELECTION_TOOLBAR_OFFSET_PX } from "./selection-geometry";

const ARROW_ENDPOINT_HANDLE_RADIUS_PX = 4;
const ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX = 12;
const ARROW_CURVE_HANDLE_WIDTH_PX = 16;
const ARROW_CURVE_HANDLE_HEIGHT_PX = 5;
type ArrowSelectionSession = ObjectSelectionSession & {
  kind: "endpoint" | "point" | "curve";
  endpoint?: "start" | "end";
  pointIndex?: number;
};

export const arrowSelectionAdapter: ObjectSelectionAdapter<
  ArrowObject,
  ArrowSelectionSession
> = {
  renderSelection: ({ context, object, projection, color }) => {
    const startPoint = projection.worldToCanvas(object.props.start);
    const endPoint = projection.worldToCanvas(object.props.end);

    context.save();
    context.fillStyle = colors.white;
    context.strokeStyle = color;
    context.lineWidth = 1.5;

    for (const point of (object.props.geometry === "polyline"
      ? getArrowPolylinePoints(object.props)
      : [object.props.start, object.props.end]
    ).map((endpoint) => projection.worldToCanvas(endpoint))) {
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

    if (object.props.bodyStyle === "curved") {
      const handlePoint = projection.worldToCanvas(
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

    const canvasPoint = projection.worldToCanvas(event.point);

    for (const { endpoint, point } of [
      { endpoint: "start" as const, point: object.props.start },
      { endpoint: "end" as const, point: object.props.end },
    ]) {
      const endpointCanvasPoint = projection.worldToCanvas(point);
      const distance = Math.hypot(
        canvasPoint.x - endpointCanvasPoint.x,
        canvasPoint.y - endpointCanvasPoint.y,
      );

      if (distance <= ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX) {
        return {
          kind: "endpoint",
          endpoint,
        };
      }
    }

    if (object.props.geometry === "polyline") {
      for (const [pointIndex, point] of getArrowPolylinePoints(
        object.props,
      ).entries()) {
        const pointCanvas = projection.worldToCanvas(point);
        const distance = Math.hypot(
          canvasPoint.x - pointCanvas.x,
          canvasPoint.y - pointCanvas.y,
        );

        if (distance <= ARROW_ENDPOINT_HANDLE_HIT_RADIUS_PX) {
          return {
            kind: "point",
            pointIndex,
          };
        }
      }
    }

    if (object.props.bodyStyle !== "curved") {
      return undefined;
    }

    const handlePoint = projection.worldToCanvas(
      getArrowCurveHandlePoint(
        object.props.start,
        object.props.end,
        object.props.curveOffset,
      ),
    );
    const startPoint = projection.worldToCanvas(object.props.start);
    const endPoint = projection.worldToCanvas(object.props.end);
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
      case "point":
        return setArrowPolylinePoint(
          object,
          session.pointIndex ?? 0,
          event.point,
        );
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
    if (object.props.geometry === "polyline") {
      const bounds = projection.getObjectCanvasBounds(object);

      return {
        left: bounds.x + bounds.width / 2,
        top: bounds.y - SELECTION_TOOLBAR_OFFSET_PX,
      };
    }

    const start = projection.worldToCanvas(object.props.start);
    const end = projection.worldToCanvas(object.props.end);
    const controlPoint =
      object.props.bodyStyle === "curved"
        ? projection.worldToCanvas(
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
  toolbarRenderer: BoardEditorArrowSelectionToolbar,
};
