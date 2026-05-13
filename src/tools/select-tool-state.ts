import type { ObjectId, Point } from "../core/board/types";
import type { BoardEditorToolState } from "../core/editor/types";

export const SELECT_TOOL_ID = "select";

interface SelectDragInteraction {
  mode: "drag";
  dragObjectIds: ObjectId[];
  lastPoint: Point;
}

interface SelectMarqueeInteraction {
  mode: "marquee";
  origin: Point;
  current: Point;
  baseSelection: ObjectId[];
}

interface SelectArrowEndpointInteraction {
  mode: "arrow-endpoint";
  objectId: ObjectId;
  endpoint: "start" | "end";
}

interface SelectArrowPointInteraction {
  mode: "arrow-point";
  objectId: ObjectId;
  pointIndex: number;
}

interface SelectArrowCurveInteraction {
  mode: "arrow-curve";
  objectId: ObjectId;
}

interface SelectShapeResizeInteraction {
  mode: "shape-resize";
  objectId: ObjectId;
  handle:
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
}

interface SelectPlayerResizeInteraction {
  mode: "player-resize";
  objectId: ObjectId;
  center: Point;
}

interface SelectPlayerRotateInteraction {
  mode: "player-rotate";
  objectId: ObjectId;
  center: Point;
}

interface SelectEquipmentResizeInteraction {
  mode: "equipment-resize";
  objectId: ObjectId;
  center: Point;
  initialSize: {
    width: number;
    height: number;
  };
  lockedAspectRatio: boolean;
}

interface SelectEquipmentRotateInteraction {
  mode: "equipment-rotate";
  objectId: ObjectId;
  center: Point;
}

export type SelectToolInteraction =
  | SelectDragInteraction
  | SelectMarqueeInteraction
  | SelectArrowEndpointInteraction
  | SelectArrowPointInteraction
  | SelectArrowCurveInteraction
  | SelectShapeResizeInteraction
  | SelectPlayerResizeInteraction
  | SelectPlayerRotateInteraction
  | SelectEquipmentResizeInteraction
  | SelectEquipmentRotateInteraction;

export interface SelectToolState {
  selectedObjectIds: ObjectId[];
  interaction?: SelectToolInteraction;
}

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
