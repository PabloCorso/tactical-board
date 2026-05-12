import type { Point } from "../core/board/types";
import type { BoardEditorToolState } from "../core/editor/types";
import type {
  ArrowBodyStyle,
  ArrowObjectProps,
  ArrowHeadStyle,
  ArrowLineStyle,
} from "../core/objects/arrow-object";
import { DEFAULT_ARROW_DASH_STYLE } from "../core/objects/arrow-object";

export const ARROW_TOOL_ID = "arrow";

export interface ArrowDraftStyle {
  color: string;
  strokeWidth: number;
  lineStyle: ArrowLineStyle;
  dashStyle: ArrowObjectProps["dashStyle"];
  bodyStyle: ArrowBodyStyle;
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
}

export interface ArrowToolState {
  draftStyle: ArrowDraftStyle;
  pendingStart?: Point;
}

export const DEFAULT_ARROW_TOOL_STATE: ArrowToolState = {
  draftStyle: {
    color: "#000000",
    strokeWidth: 0.4,
    lineStyle: "solid",
    dashStyle: [...DEFAULT_ARROW_DASH_STYLE],
    bodyStyle: "straight",
    startHead: "none",
    endHead: "triangle",
  },
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
    pendingStart:
      state?.pendingStart &&
      typeof state.pendingStart.x === "number" &&
      typeof state.pendingStart.y === "number"
        ? state.pendingStart
        : undefined,
  };
}
