import type { BoardObject, ObjectType, Point } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import type {
  CanvasObjectHitTester,
  CanvasObjectRenderer,
} from "../rendering/canvas/types";
import type {
  ErasedObjectSelectionAdapter,
  ObjectSelectionAdapter,
  ObjectSelectionSession,
} from "./object-selection";

export interface ObjectBehaviorAdapter<
  TObject extends BoardObject = BoardObject,
> {
  move?: (object: TObject, delta: Point) => TObject;
  rotate?: (object: TObject, center: Point, rotationDelta: number) => TObject;
}

export interface CanvasObjectAdapter {
  render: CanvasObjectRenderer;
  hitTest?: CanvasObjectHitTester;
}

export interface ObjectDefinition {
  type: ObjectType;
  defaultOrderRank?: number;
  beginEditing?: (input: {
    object: BoardObject;
    state: BoardEditorState;
    canvasRect: { width: number; height: number };
  }) => void;
  behaviors?: ObjectBehaviorAdapter;
  selection?: ErasedObjectSelectionAdapter;
  canvas: CanvasObjectAdapter;
}

export interface ObjectRegistry {
  definitions: Record<ObjectType, ObjectDefinition>;
}

export function createObjectRegistry(
  definitions: ObjectDefinition[] = [],
): ObjectRegistry {
  return {
    definitions: Object.fromEntries(
      definitions.map((definition) => [definition.type, definition]),
    ),
  };
}

export type ObjectDefinitionInput<
  TObject extends BoardObject,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
> = Omit<
  ObjectDefinition,
  "type" | "beginEditing" | "behaviors" | "selection"
> & {
  type: TObject["type"];
  beginEditing?: (input: {
    object: TObject;
    state: BoardEditorState;
    canvasRect: { width: number; height: number };
  }) => void;
  behaviors?: ObjectBehaviorAdapter<TObject>;
  selection?: ObjectSelectionAdapter<TObject, TSession>;
};

export function defineObjectDefinition<
  TObject extends BoardObject,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
>(definition: ObjectDefinitionInput<TObject, TSession>): ObjectDefinition {
  return definition as unknown as ObjectDefinition;
}
