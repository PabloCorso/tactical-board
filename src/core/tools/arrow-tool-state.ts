import type { Point } from "../board/types";
import type { BoardEditorToolState } from "../editor/types";
import type {
  ArrowKind,
  ArrowObjectProps,
  ArrowHeadStyle,
  ArrowLineStyle,
} from "../objects/arrow-object";
import {
  DEFAULT_ARROW_DASH_STYLE,
  DEFAULT_ARROW_STROKE_WIDTH,
} from "../objects/arrow-object";
import { DEFAULT_PRESET_COLOR } from "../colors/preset-colors";

export const ARROW_TOOL_ID = "arrow";

export type ArrowDraftStyle = {
  color: string;
  strokeWidth: number;
  lineStyle: ArrowLineStyle;
  dashStyle: ArrowObjectProps["dashStyle"];
  kind: ArrowKind;
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
};

export type ArrowToolState = {
  draftStyle: ArrowDraftStyle;
  pendingPoints: Point[];
};

export const DEFAULT_ARROW_TOOL_STATE: ArrowToolState = {
  draftStyle: {
    color: DEFAULT_PRESET_COLOR.black,
    strokeWidth: DEFAULT_ARROW_STROKE_WIDTH,
    lineStyle: "solid",
    dashStyle: [...DEFAULT_ARROW_DASH_STYLE],
    kind: "straight",
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
