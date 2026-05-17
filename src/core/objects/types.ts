import type { Point, Shape, ShapeType, SkinId } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import type { Rect } from "../geometry/types";
import type {
  ErasedObjectSelectionAdapter,
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "./object-selection";

export interface ObjectRenderContext {
  skinId?: SkinId;
}

export interface ShapeBehaviorAdapter<TShape extends Shape = Shape> {
  move?: (object: TShape, delta: Point) => TShape;
  rotate?: (object: TShape, center: Point, rotationDelta: number) => TShape;
}

export interface ShapeDefinition {
  type: ShapeType;
  createDefault?: (input: Pick<Shape, "id" | "position">) => Shape;
  getBounds?: (object: Shape) => Rect;
  render?: (object: Shape, context: ObjectRenderContext) => void;
  beginEditing?: (input: {
    object: Shape;
    state: BoardEditorState;
    canvasRect: { width: number; height: number };
  }) => void;
  hitTestMode?: "normal" | "passthrough" | "bounds-only";
  behaviors?: ShapeBehaviorAdapter;
  selection?: ErasedObjectSelectionAdapter;
}

export interface ShapeRegistry {
  definitions: Record<ShapeType, ShapeDefinition>;
}

type ShapeDefinitionInput<
  TShape extends Shape,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
> = Omit<
  ShapeDefinition,
  "type" | "createDefault" | "getBounds" | "render" | "behaviors" | "selection"
> & {
  type: TShape["type"];
  createDefault?: (input: Pick<TShape, "id" | "position">) => TShape;
  getBounds?: (object: TShape) => Rect;
  render?: (object: TShape, context: ObjectRenderContext) => void;
  beginEditing?: (input: {
    object: TShape;
    state: BoardEditorState;
    canvasRect: { width: number; height: number };
  }) => void;
  behaviors?: ShapeBehaviorAdapter<TShape>;
  selection?: ObjectSelectionAdapter<TShape, TSession>;
};

export function defineShapeDefinition<
  TShape extends Shape,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
>(definition: ShapeDefinitionInput<TShape, TSession>): ShapeDefinition {
  return definition as unknown as ShapeDefinition;
}

// Compatibility names kept while callers migrate from Board Object terminology.
// Prefer ShapeDefinition/ShapeRegistry/defineShapeDefinition for new core work.
export type ObjectBehaviorAdapter<TObject extends Shape = Shape> =
  ShapeBehaviorAdapter<TObject>;
export type ObjectDefinition = ShapeDefinition;
export type ObjectRegistry = ShapeRegistry;
export type ObjectDefinitionInput<
  TObject extends Shape,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
> = ShapeDefinitionInput<TObject, TSession>;

export function defineObjectDefinition<
  TObject extends Shape,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
>(definition: ObjectDefinitionInput<TObject, TSession>): ObjectDefinition {
  return defineShapeDefinition(definition);
}
