import type { Point } from "../core/board/types";
import type { BoardEditorToolState } from "../core/editor/types";
import type {
  ArrowBodyStyle,
  ArrowHeadStyle,
} from "../core/objects/arrow-object";
import colors from "tailwindcss/colors";

export const ARROW_TOOL_ID = "arrow";

export interface ArrowDraftStyle {
  color: string;
  strokeWidth: number;
  dashed: boolean;
  bodyStyle: ArrowBodyStyle;
  startHead: ArrowHeadStyle;
  endHead: ArrowHeadStyle;
}

export interface ArrowToolState {
  draftStyle: ArrowDraftStyle;
  activePresetId?: string;
  pendingStart?: Point;
}

export const DEFAULT_ARROW_TOOL_STATE: ArrowToolState = {
  draftStyle: {
    color: colors.slate[50],
    strokeWidth: 0.4,
    dashed: false,
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
    activePresetId:
      typeof state?.activePresetId === "string"
        ? state.activePresetId
        : undefined,
    pendingStart:
      state?.pendingStart &&
      typeof state.pendingStart.x === "number" &&
      typeof state.pendingStart.y === "number"
        ? state.pendingStart
        : undefined,
  };
}
