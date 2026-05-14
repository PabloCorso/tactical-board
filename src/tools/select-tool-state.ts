import type { ObjectId, Point } from "../core/board/types";
import type { BoardEditorToolState } from "../core/editor/types";
import type { ObjectSelectionInteraction } from "../core/objects/object-selection";

export const SELECT_TOOL_ID = "select";

type SelectDragInteraction = {
  mode: "drag";
  dragObjectIds: ObjectId[];
  lastPoint: Point;
};

type SelectMarqueeInteraction = {
  mode: "marquee";
  origin: Point;
  current: Point;
  baseSelection: ObjectId[];
};

export type SelectToolInteraction =
  | SelectDragInteraction
  | SelectMarqueeInteraction
  | ObjectSelectionInteraction;

export type SelectToolState = {
  selectedObjectIds: ObjectId[];
  interaction?: SelectToolInteraction;
};

export function getSelectToolState(
  toolState: BoardEditorToolState,
): SelectToolState {
  const state = toolState[SELECT_TOOL_ID] as
    | Partial<SelectToolState>
    | undefined;

  return {
    selectedObjectIds: Array.isArray(state?.selectedObjectIds)
      ? state.selectedObjectIds.filter(
          (objectId): objectId is ObjectId => typeof objectId === "string",
        )
      : [],
    interaction:
      state?.interaction &&
      typeof state.interaction === "object" &&
      "mode" in state.interaction
        ? (state.interaction as SelectToolInteraction)
        : undefined,
  };
}
