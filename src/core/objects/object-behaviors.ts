import type { BoardObject, Point } from "../board/types";
import type { BoardEditorState } from "../editor/types";

function getObjectBehaviorAdapter(
  state: Pick<BoardEditorState, "objectRegistry">,
  object: BoardObject,
) {
  return state.objectRegistry.definitions[object.type]?.behaviors;
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

export function defaultMoveBoardObject(
  object: BoardObject,
  delta: Point,
): BoardObject {
  return {
    ...object,
    position: {
      x: object.position.x + delta.x,
      y: object.position.y + delta.y,
    },
  };
}

export function defaultRotateBoardObject(
  object: BoardObject,
  center: Point,
  rotationDelta: number,
): BoardObject {
  return {
    ...object,
    position: rotatePointAround(object.position, center, rotationDelta),
    rotation:
      typeof object.rotation === "number"
        ? object.rotation + rotationDelta
        : object.rotation,
  };
}

export function moveBoardObject(
  state: Pick<BoardEditorState, "objectRegistry">,
  object: BoardObject,
  delta: Point,
): BoardObject {
  return (
    getObjectBehaviorAdapter(state, object)?.move?.(object, delta) ??
    defaultMoveBoardObject(object, delta)
  );
}

export function rotateBoardObject(
  state: Pick<BoardEditorState, "objectRegistry">,
  object: BoardObject,
  center: Point,
  rotationDelta: number,
): BoardObject {
  return (
    getObjectBehaviorAdapter(state, object)?.rotate?.(
      object,
      center,
      rotationDelta,
    ) ?? defaultRotateBoardObject(object, center, rotationDelta)
  );
}
