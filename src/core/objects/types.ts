import type { BoardObjectBase, ObjectType, SkinId } from "../board/types";
import type { Rect } from "../geometry/types";

export interface ObjectRenderContext {
  selected: boolean;
  skinId?: SkinId;
}

export interface ObjectDefinition<
  TObject extends BoardObjectBase<object> = BoardObjectBase<object>,
> {
  type: ObjectType;
  createDefault: (input: Pick<TObject, "id" | "position">) => TObject;
  getBounds: (object: TObject) => Rect;
  render: (object: TObject, context: ObjectRenderContext) => void;
  selectable?: boolean;
  hitTestMode?: "normal" | "passthrough" | "bounds-only";
}

export interface ObjectRegistry {
  definitions: Record<ObjectType, ObjectDefinition>;
}
