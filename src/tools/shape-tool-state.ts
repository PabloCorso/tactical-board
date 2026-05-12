import type { Point } from "../core/board/types";
import type { BoardEditorToolState } from "../core/editor/types";
import type {
  ShapeFillStyle,
  ShapeKind,
  ShapeLineStyle,
  ShapeObjectProps,
} from "../core/objects/shape-object";
import { DEFAULT_SHAPE_DASH_STYLE } from "../core/objects/shape-object";

export const SHAPE_TOOL_ID = "shape";

export interface ShapeDraftStyle {
  kind: ShapeKind;
  color: string;
  strokeWidth: number;
  lineStyle: ShapeLineStyle;
  dashStyle: ShapeObjectProps["dashStyle"];
  fillStyle: ShapeFillStyle;
  bordered: boolean;
  fillOpacity: number;
}

export interface ShapeToolState {
  draftStyle: ShapeDraftStyle;
  pendingPoints: Point[];
}

export const DEFAULT_SHAPE_TOOL_STATE: ShapeToolState = {
  draftStyle: {
    kind: "rectangle",
    color: "#000000",
    strokeWidth: 0.4,
    lineStyle: "solid",
    dashStyle: [...DEFAULT_SHAPE_DASH_STYLE],
    fillStyle: "solid",
    bordered: true,
    fillOpacity: 0.15,
  },
  pendingPoints: [],
};

export function getShapeToolState(
  toolState: BoardEditorToolState,
): ShapeToolState {
  const state = toolState[SHAPE_TOOL_ID] as Partial<ShapeToolState> | undefined;

  return {
    draftStyle: {
      ...DEFAULT_SHAPE_TOOL_STATE.draftStyle,
      ...(state?.draftStyle ?? {}),
    },
    pendingPoints: Array.isArray(state?.pendingPoints)
      ? state.pendingPoints.filter(
          (point): point is Point =>
            typeof point?.x === "number" && typeof point?.y === "number",
        )
      : [],
  };
}
