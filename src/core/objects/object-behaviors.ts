import type { BoardObject, Point } from "../board/types";
import {
  ARROW_OBJECT_TYPE,
  moveArrowObject,
  type ArrowObject,
} from "./arrow-object";
import {
  moveShapeObject,
  SHAPE_OBJECT_TYPE,
  type ShapeObject,
} from "./shape-object";

export function moveBoardObject(
  object: BoardObject,
  delta: Point,
): BoardObject {
  switch (object.type) {
    case ARROW_OBJECT_TYPE:
      return moveArrowObject(object as ArrowObject, delta);
    case SHAPE_OBJECT_TYPE:
      return moveShapeObject(object as ShapeObject, delta);
    default:
      return {
        ...object,
        position: {
          x: object.position.x + delta.x,
          y: object.position.y + delta.y,
        },
      };
  }
}
