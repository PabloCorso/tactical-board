import type { BoardObject, ObjectId, Point } from "../core/board/types";
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

type SelectGroupSelectionInteraction = {
  mode: "group-selection";
  selectedObjectIds: ObjectId[];
  session: {
    kind: "resize" | "rotate";
    handle?:
      | "top"
      | "right"
      | "bottom"
      | "left"
      | "top-left"
      | "top-right"
      | "bottom-right"
      | "bottom-left";
    bounds: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
    center: Point;
    pointerOffset?: Point;
    initialPointerAngle?: number;
    initialObjects: BoardObject[];
  };
};

export type SelectToolInteraction =
  | SelectDragInteraction
  | SelectMarqueeInteraction
  | SelectGroupSelectionInteraction
  | ObjectSelectionInteraction;

export type SelectToolState = {
  interaction?: SelectToolInteraction;
};

export function getSelectToolState(
  toolState: BoardEditorToolState,
): SelectToolState {
  const state = toolState[SELECT_TOOL_ID] as
    | Partial<SelectToolState>
    | undefined;

  return {
    interaction:
      state?.interaction &&
      typeof state.interaction === "object" &&
      "mode" in state.interaction
        ? (state.interaction as SelectToolInteraction)
        : undefined,
  };
}
