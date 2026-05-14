import type { Point } from "../core/board/types";
import type { BoardEditorToolState } from "../core/editor/types";
import type {
  ArrowGeometry,
  ArrowBodyStyle,
  ArrowObjectProps,
  ArrowHeadStyle,
  ArrowLineStyle,
} from "../core/objects/arrow-object";
import {
  DEFAULT_ARROW_DASH_STYLE,
  DEFAULT_ARROW_STROKE_WIDTH,
} from "../core/objects/arrow-object";

export const ARROW_TOOL_ID = "arrow";

export type ArrowDraftStyle = {
  geometry: ArrowGeometry;
  color: string;
  strokeWidth: number;
  lineStyle: ArrowLineStyle;
  dashStyle: ArrowObjectProps["dashStyle"];
  bodyStyle: ArrowBodyStyle;
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
};

export type ArrowToolState = {
  draftStyle: ArrowDraftStyle;
  pendingPoints: Point[];
};

export const DEFAULT_ARROW_TOOL_STATE: ArrowToolState = {
  draftStyle: {
    geometry: "simple",
    color: "#000000",
    strokeWidth: DEFAULT_ARROW_STROKE_WIDTH,
    lineStyle: "solid",
    dashStyle: [...DEFAULT_ARROW_DASH_STYLE],
    bodyStyle: "straight",
    startHead: "none",
    endHead: "triangle",
  },
  pendingPoints: [],
};

export function getArrowToolState(
  toolState: BoardEditorToolState,
): ArrowToolState {
  const state = toolState[ARROW_TOOL_ID] as Partial<ArrowToolState> | undefined;

  return {
    draftStyle: {
      ...DEFAULT_ARROW_TOOL_STATE.draftStyle,
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
