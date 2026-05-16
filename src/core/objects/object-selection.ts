import type { ComponentType } from "react";
import type { BoardObject, ObjectId, Point } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import type { createBoardSpaceProjection } from "../geometry/board-space-projection";
import type { ToolPointerEvent } from "../tools/types";

export type SelectionProjection = Pick<
  ReturnType<typeof createBoardSpaceProjection>,
  "getObjectCanvasBounds" | "worldToCanvas" | "canvasToWorld" | "pixelsPerUnit"
>;

export interface SelectionToolbarRendererProps<
  TObject extends BoardObject = BoardObject,
> {
  className?: string;
  selectedObject: TObject;
  toolbarLeft: number;
  toolbarTop: number;
  toolbarBottom: number;
  viewportHeight: number;
  viewportWidth: number;
}

export type SelectionToolbarRenderer<
  TObject extends BoardObject = BoardObject,
> = ComponentType<SelectionToolbarRendererProps<TObject>>;

export interface ObjectSelectionRenderInput<
  TObject extends BoardObject = BoardObject,
> {
  context: CanvasRenderingContext2D;
  object: TObject;
  projection: SelectionProjection;
  color: string;
}

export interface ObjectSelectionHitTestInput<
  TObject extends BoardObject = BoardObject,
> {
  state: BoardEditorState;
  object: TObject;
  projection: SelectionProjection;
  event: ToolPointerEvent;
}

export interface ObjectSelectionInteractionInput<
  TObject extends BoardObject = BoardObject,
  TSession extends Record<string, unknown> = Record<string, unknown>,
> {
  object: TObject;
  session: TSession;
  event: ToolPointerEvent;
}

export interface ObjectSelectionToolbarAnchorInput<
  TObject extends BoardObject = BoardObject,
> {
  object: TObject;
  projection: SelectionProjection;
}

export interface ObjectSelectionCanvasBoundsInput<
  TObject extends BoardObject = BoardObject,
> {
  object: TObject;
  projection: SelectionProjection;
}

export interface ObjectTransformCapabilities {
  move?: boolean;
  resize?: boolean;
  rotate?: boolean;
}

export type ObjectSelectionSession = {
  kind: string;
  [key: string]: unknown;
};

export interface ObjectSelectionAdapter<
  TObject extends BoardObject = BoardObject,
  TSession extends ObjectSelectionSession = ObjectSelectionSession,
> {
  getTransformCapabilities?: (
    object: TObject,
  ) => ObjectTransformCapabilities | undefined;
  getCanvasBounds?: (
    input: ObjectSelectionCanvasBoundsInput<TObject>,
  ) => { left: number; right: number; top: number; bottom: number } | undefined;
  renderSelection?: (input: ObjectSelectionRenderInput<TObject>) => void;
  hitSelectionHandle?: (
    input: ObjectSelectionHitTestInput<TObject>,
  ) => TSession | undefined;
  updateSelectionInteraction?: (
    input: ObjectSelectionInteractionInput<TObject, TSession>,
  ) => TObject;
  getToolbarAnchor?: (
    input: ObjectSelectionToolbarAnchorInput<TObject>,
  ) => { left: number; top: number } | undefined;
  toolbarRenderer?: SelectionToolbarRenderer<TObject>;
}

export type ErasedObjectSelectionAdapter<
  TObject extends BoardObject = BoardObject,
> = ObjectSelectionAdapter<TObject>;

export function getObjectSelectionAdapter(
  state: Pick<BoardEditorState, "objectRegistry">,
  objectType: string,
) {
  return state.objectRegistry.definitions[objectType]?.selection;
}

export function getObjectSelectionAdapterForObject(
  state: Pick<BoardEditorState, "objectRegistry">,
  object: BoardObject | undefined,
) {
  return object ? getObjectSelectionAdapter(state, object.type) : undefined;
}

export interface ObjectSelectionInteraction {
  mode: "object-selection";
  objectId: ObjectId;
  session: ObjectSelectionSession;
}

export function isObjectSelectionInteraction(
  interaction: unknown,
): interaction is ObjectSelectionInteraction {
  return (
    typeof interaction === "object" &&
    interaction !== null &&
    "mode" in interaction &&
    (interaction as { mode?: unknown }).mode === "object-selection"
  );
}

export function getPointerAngle(center: Point, point: Point) {
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return Math.atan2(dy, dx);
}
