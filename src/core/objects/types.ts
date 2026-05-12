import type { BoardObject, ObjectType, SkinId } from "../board/types";
import type { Rect } from "../geometry/types";

export interface ObjectRenderContext {
  skinId?: SkinId;
}

export interface ObjectDefinition {
  type: ObjectType;
  createDefault: (input: Pick<BoardObject, "id" | "position">) => BoardObject;
  getBounds: (object: BoardObject) => Rect;
  render: (object: BoardObject, context: ObjectRenderContext) => void;
  hitTestMode?: "normal" | "passthrough" | "bounds-only";
}

export interface ObjectRegistry {
  definitions: Record<ObjectType, ObjectDefinition>;
}
