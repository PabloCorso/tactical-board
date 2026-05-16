import type { BoardObject, ObjectType, Point, SkinId } from "../board/types";
import type { Rect } from "../geometry/types";
import type {
  ErasedObjectSelectionAdapter,
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "./object-selection";

export interface ObjectRenderContext {
  skinId?: SkinId;
}

export interface ObjectBehaviorAdapter<
  TObject extends BoardObject = BoardObject,
> {
  move?: (object: TObject, delta: Point) => TObject;
  rotate?: (object: TObject, center: Point, rotationDelta: number) => TObject;
}

export interface ObjectDefinition {
  type: ObjectType;
  createDefault?: (input: Pick<BoardObject, "id" | "position">) => BoardObject;
  getBounds?: (object: BoardObject) => Rect;
  render?: (object: BoardObject, context: ObjectRenderContext) => void;
  hitTestMode?: "normal" | "passthrough" | "bounds-only";
  behaviors?: ObjectBehaviorAdapter;
  selection?: ErasedObjectSelectionAdapter;
}

export interface ObjectRegistry {
  definitions: Record<ObjectType, ObjectDefinition>;
}

type ObjectDefinitionInput<
  TObject extends BoardObject,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
> = Omit<
  ObjectDefinition,
  "type" | "createDefault" | "getBounds" | "render" | "behaviors" | "selection"
> & {
  type: TObject["type"];
  createDefault?: (input: Pick<TObject, "id" | "position">) => TObject;
  getBounds?: (object: TObject) => Rect;
  render?: (object: TObject, context: ObjectRenderContext) => void;
  behaviors?: ObjectBehaviorAdapter<TObject>;
  selection?: ObjectSelectionAdapter<TObject, TSession>;
};

export function defineObjectDefinition<
  TObject extends BoardObject,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
>(definition: ObjectDefinitionInput<TObject, TSession>): ObjectDefinition {
  return definition as unknown as ObjectDefinition;
}
