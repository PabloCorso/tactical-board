import colors from "tailwindcss/colors";
import {
  getShapeBounds,
  resizeShapeObject,
  resizeShapeObjectToBounds,
  rotateShapeObject,
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "../core/objects/shape-object";
import type {
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "../core/objects/object-selection";
import { BoardEditorShapeSelectionToolbar } from "../react/components/board-editor-selection-toolbar-shape";
import {
  distanceToSegment,
  drawClosedCanvasPath,
  drawRoundedSquareHandle,
  getCornerHandleCanvasPoint,
  getExpandedCanvasRectPoints,
  getRotatedRectWorldPoints,
  getRotationFromPointer,
  getSelectionToolbarAnchorFromSelectionChrome,
  renderRotateHandleIcon,
  rotatePointAround,
} from "./selection-geometry";

const SHAPE_RESIZE_HANDLE_RADIUS_PX = 4;
const SHAPE_RESIZE_HANDLE_HIT_RADIUS_PX = 12;
const SHAPE_RESIZE_EDGE_HIT_RADIUS_PX = 8;
const ROTATE_HANDLE_RADIUS_PX = 11;
const ROTATE_HANDLE_CORNER_INDEX = 3;
const ROTATE_HANDLE_CORNER_OFFSET_PX = 18;
type ShapeSelectionSession = ObjectSelectionSession & {
  kind: "resize" | "rotate";
  center?: ShapeObject["position"];
  rotation?: number;
  handle?:
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-left"
    | "top-right"
    | "bottom-right"
    | "bottom-left";
  selectionBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  padding?: number;
  pointerOffset?: ShapeObject["position"];
  initialRotation?: number;
  initialPointerAngle?: number;
};

function getShapeResizeHandlePoints(shape: ShapeObject) {
  return getRotatedRectWorldPoints({
    center: shape.position,
    width: shape.size?.width ?? 0,
    height: shape.size?.height ?? 0,
    rotation: shape.rotation,
  }).map((point, index) => ({
    handle:
      index === 0
        ? ("top-left" as const)
        : index === 1
          ? ("top-right" as const)
          : index === 2
            ? ("bottom-right" as const)
            : ("bottom-left" as const),
    point,
  }));
}

function getShapeSelectionPaddingPx(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<ShapeObject>["renderSelection"]>
  >[0]["projection"],
  shape: ShapeObject,
) {
  if (!shape.props.bordered) {
    return 0;
  }

  return Math.max(1.5, shape.props.strokeWidth * projection.pixelsPerUnit) / 2;
}

function getShapeSelectionOutlineCanvasPoints(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<ShapeObject>["renderSelection"]>
  >[0]["projection"],
  shape: ShapeObject,
) {
  const paddingPx = getShapeSelectionPaddingPx(projection, shape);

  return getExpandedCanvasRectPoints(
    getShapeResizeHandlePoints(shape).map(({ point }) =>
      projection.worldToCanvas(point),
    ),
    paddingPx,
  );
}

function getShapeSelectionBoundsWorld(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<ShapeObject>["renderSelection"]>
  >[0]["projection"],
  shape: ShapeObject,
) {
  const shapeBounds = getShapeBounds(shape.props);
  const padding =
    getShapeSelectionPaddingPx(projection, shape) / projection.pixelsPerUnit;

  return {
    minX: shapeBounds.minX - padding,
    maxX: shapeBounds.maxX + padding,
    minY: shapeBounds.minY - padding,
    maxY: shapeBounds.maxY + padding,
    padding,
  };
}

function getShapeResizeReferencePoint(
  selectionBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  },
  handle: NonNullable<ShapeSelectionSession["handle"]>,
  point: ShapeObject["position"],
) {
  switch (handle) {
    case "top-left":
      return { x: selectionBounds.minX, y: selectionBounds.minY };
    case "top-right":
      return { x: selectionBounds.maxX, y: selectionBounds.minY };
    case "bottom-right":
      return { x: selectionBounds.maxX, y: selectionBounds.maxY };
    case "bottom-left":
      return { x: selectionBounds.minX, y: selectionBounds.maxY };
    case "top":
      return {
        x: Math.min(
          Math.max(point.x, selectionBounds.minX),
          selectionBounds.maxX,
        ),
        y: selectionBounds.minY,
      };
    case "right":
      return {
        x: selectionBounds.maxX,
        y: Math.min(
          Math.max(point.y, selectionBounds.minY),
          selectionBounds.maxY,
        ),
      };
    case "bottom":
      return {
        x: Math.min(
          Math.max(point.x, selectionBounds.minX),
          selectionBounds.maxX,
        ),
        y: selectionBounds.maxY,
      };
    case "left":
      return {
        x: selectionBounds.minX,
        y: Math.min(
          Math.max(point.y, selectionBounds.minY),
          selectionBounds.maxY,
        ),
      };
  }
}

function getShapeRotateHandleCanvasPoint(
  projection: Parameters<
    NonNullable<ObjectSelectionAdapter<ShapeObject>["renderSelection"]>
  >[0]["projection"],
  shape: ShapeObject,
) {
  return getCornerHandleCanvasPoint(
    getShapeSelectionOutlineCanvasPoints(projection, shape),
    ROTATE_HANDLE_CORNER_INDEX,
    ROTATE_HANDLE_CORNER_OFFSET_PX,
  );
}

export const shapeSelectionAdapter: ObjectSelectionAdapter<
  ShapeObject,
  ShapeSelectionSession
> = {
  renderSelection: ({ context, object, projection, color }) => {
    const outlinePoints = getShapeSelectionOutlineCanvasPoints(
      projection,
      object,
    );

    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.fillStyle = colors.white;
    drawClosedCanvasPath(context, outlinePoints);
    context.stroke();

    if (!object.locked) {
      for (const handlePoint of outlinePoints) {
        drawRoundedSquareHandle(
          context,
          handlePoint,
          SHAPE_RESIZE_HANDLE_RADIUS_PX,
          2,
        );
        context.fill();
        context.stroke();
      }

      renderRotateHandleIcon(
        context,
        getShapeRotateHandleCanvasPoint(projection, object),
        ROTATE_HANDLE_RADIUS_PX,
        object.rotation,
      );
    }

    context.restore();
  },
  hitSelectionHandle: ({ object, projection, event }) => {
    if (object.type !== SHAPE_OBJECT_TYPE || object.locked) {
      return undefined;
    }

    const canvasPoint = projection.worldToCanvas(event.point);
    const outlinePoints = getShapeSelectionOutlineCanvasPoints(
      projection,
      object,
    );
    let nearest:
      | (ShapeSelectionSession & {
          distance: number;
        })
      | undefined;
    const { minX, maxX, minY, maxY, padding } = getShapeSelectionBoundsWorld(
      projection,
      object,
    );
    const selectionBounds = { minX, maxX, minY, maxY };

    for (const [index, handleCanvasPoint] of outlinePoints.entries()) {
      const handle =
        index === 0
          ? ("top-left" as const)
          : index === 1
            ? ("top-right" as const)
            : index === 2
              ? ("bottom-right" as const)
              : ("bottom-left" as const);
      const distance = Math.hypot(
        canvasPoint.x - handleCanvasPoint.x,
        canvasPoint.y - handleCanvasPoint.y,
      );

      if (
        distance <= SHAPE_RESIZE_HANDLE_HIT_RADIUS_PX &&
        (!nearest || distance < nearest.distance)
      ) {
        const localPoint = rotatePointAround(
          event.point,
          object.position,
          -(object.rotation ?? 0),
        );
        const reference = getShapeResizeReferencePoint(
          selectionBounds,
          handle,
          localPoint,
        );

        nearest = {
          kind: "resize",
          handle,
          distance,
          selectionBounds,
          padding,
          center: object.position,
          rotation: object.rotation ?? 0,
          pointerOffset: {
            x: localPoint.x - reference.x,
            y: localPoint.y - reference.y,
          },
        };
      }
    }

    if (nearest) {
      return nearest;
    }

    const edgeHits = [
      {
        handle: "top" as const,
        distance: distanceToSegment(
          canvasPoint,
          outlinePoints[0],
          outlinePoints[1],
        ),
      },
      {
        handle: "right" as const,
        distance: distanceToSegment(
          canvasPoint,
          outlinePoints[1],
          outlinePoints[2],
        ),
      },
      {
        handle: "bottom" as const,
        distance: distanceToSegment(
          canvasPoint,
          outlinePoints[2],
          outlinePoints[3],
        ),
      },
      {
        handle: "left" as const,
        distance: distanceToSegment(
          canvasPoint,
          outlinePoints[3],
          outlinePoints[0],
        ),
      },
    ];

    for (const edgeHit of edgeHits) {
      if (
        edgeHit.distance <= SHAPE_RESIZE_EDGE_HIT_RADIUS_PX &&
        (!nearest || edgeHit.distance < nearest.distance)
      ) {
        const localPoint = rotatePointAround(
          event.point,
          object.position,
          -(object.rotation ?? 0),
        );
        const reference = getShapeResizeReferencePoint(
          selectionBounds,
          edgeHit.handle,
          localPoint,
        );

        nearest = {
          kind: "resize",
          handle: edgeHit.handle,
          distance: edgeHit.distance,
          selectionBounds,
          padding,
          center: object.position,
          rotation: object.rotation ?? 0,
          pointerOffset: {
            x: localPoint.x - reference.x,
            y: localPoint.y - reference.y,
          },
        };
      }
    }

    if (nearest) {
      return {
        kind: nearest.kind,
        handle: nearest.handle,
        selectionBounds: nearest.selectionBounds,
        padding: nearest.padding,
        center: nearest.center,
        rotation: nearest.rotation,
        pointerOffset: nearest.pointerOffset,
      };
    }

    const rotateHandle = getShapeRotateHandleCanvasPoint(projection, object);
    const rotateDistance = Math.hypot(
      canvasPoint.x - rotateHandle.x,
      canvasPoint.y - rotateHandle.y,
    );

    if (rotateDistance <= ROTATE_HANDLE_RADIUS_PX + 5) {
      return {
        kind: "rotate",
        center: object.position,
        initialRotation: object.rotation ?? 0,
        initialPointerAngle: Math.atan2(
          event.point.y - object.position.y,
          event.point.x - object.position.x,
        ),
      };
    }

    return undefined;
  },
  updateSelectionInteraction: ({ object, session, event }) => {
    if (session.kind === "rotate") {
      return rotateShapeObject(
        object,
        getRotationFromPointer(
          session.center ?? object.position,
          event.point,
          session.initialRotation ?? object.rotation ?? 0,
          session.initialPointerAngle ?? 0,
        ),
      );
    }

    const localPoint = rotatePointAround(
      event.point,
      session.center ?? object.position,
      -(session.rotation ?? object.rotation ?? 0),
    );
    const pointerOffset = session.pointerOffset ?? { x: 0, y: 0 };
    const adjustedPoint = {
      x: localPoint.x - pointerOffset.x,
      y: localPoint.y - pointerOffset.y,
    };
    const selectionBounds = session.selectionBounds;

    if (!selectionBounds || !session.handle) {
      return object;
    }

    let start = { x: selectionBounds.minX, y: selectionBounds.minY };
    let end = { x: selectionBounds.maxX, y: selectionBounds.maxY };

    switch (session.handle) {
      case "left":
        start = { x: adjustedPoint.x, y: selectionBounds.minY };
        break;
      case "right":
        end = { x: adjustedPoint.x, y: selectionBounds.maxY };
        break;
      case "top":
        start = { x: selectionBounds.minX, y: adjustedPoint.y };
        break;
      case "bottom":
        end = { x: selectionBounds.maxX, y: adjustedPoint.y };
        break;
      case "top-left":
        start = adjustedPoint;
        break;
      case "top-right":
        start = { x: selectionBounds.minX, y: adjustedPoint.y };
        end = { x: adjustedPoint.x, y: selectionBounds.maxY };
        break;
      case "bottom-right":
        end = adjustedPoint;
        break;
      case "bottom-left":
        start = { x: adjustedPoint.x, y: selectionBounds.minY };
        end = { x: selectionBounds.maxX, y: adjustedPoint.y };
        break;
    }

    const nextSelectionBounds = {
      minX: Math.min(start.x, end.x),
      maxX: Math.max(start.x, end.x),
      minY: Math.min(start.y, end.y),
      maxY: Math.max(start.y, end.y),
    };
    const padding = session.padding ?? 0;
    const nextLocalBounds = {
      minX: nextSelectionBounds.minX + padding,
      maxX: nextSelectionBounds.maxX - padding,
      minY: nextSelectionBounds.minY + padding,
      maxY: nextSelectionBounds.maxY - padding,
    };
    const nextCenter = rotatePointAround(
      {
        x: (nextLocalBounds.minX + nextLocalBounds.maxX) / 2,
        y: (nextLocalBounds.minY + nextLocalBounds.maxY) / 2,
      },
      session.center ?? object.position,
      session.rotation ?? object.rotation ?? 0,
    );
    const nextBounds = {
      minX:
        nextCenter.x -
        Math.abs(nextLocalBounds.maxX - nextLocalBounds.minX) / 2,
      maxX:
        nextCenter.x +
        Math.abs(nextLocalBounds.maxX - nextLocalBounds.minX) / 2,
      minY:
        nextCenter.y -
        Math.abs(nextLocalBounds.maxY - nextLocalBounds.minY) / 2,
      maxY:
        nextCenter.y +
        Math.abs(nextLocalBounds.maxY - nextLocalBounds.minY) / 2,
    };

    return object.props.kind === "polygon"
      ? resizeShapeObjectToBounds(object, nextBounds)
      : resizeShapeObject(object, {
          start: { x: nextBounds.minX, y: nextBounds.minY },
          end: { x: nextBounds.maxX, y: nextBounds.maxY },
        });
  },
  getToolbarAnchor: ({ object, projection }) => {
    const outlinePoints = getShapeSelectionOutlineCanvasPoints(
      projection,
      object,
    );
    const rotateHandlePoint = getShapeRotateHandleCanvasPoint(
      projection,
      object,
    );

    return getSelectionToolbarAnchorFromSelectionChrome({
      left: projection.worldToCanvas(object.position).x,
      outlinePoints,
      rotateHandlePoint,
      rotateHandleRadiusPx: ROTATE_HANDLE_RADIUS_PX,
    });
  },
  toolbarRenderer: BoardEditorShapeSelectionToolbar,
};
