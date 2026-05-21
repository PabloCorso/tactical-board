import type { BoardEditorToolState } from "../editor/types";
import {
  DEFAULT_PLAYER_COLOR,
  DEFAULT_PLAYER_SIZE,
} from "../objects/player-object";

export const PLAYER_TOOL_ID = "player";

export type PlayerDraftStyle = {
  color: string;
  size: number;
};

export type PlayerToolState = {
  draftStyle: PlayerDraftStyle;
  nextNumericLabelByColor: Record<string, number>;
};

export const DEFAULT_PLAYER_TOOL_STATE: PlayerToolState = {
  draftStyle: {
    color: DEFAULT_PLAYER_COLOR,
    size: DEFAULT_PLAYER_SIZE,
  },
  nextNumericLabelByColor: {},
};

export function getPlayerToolState(
  toolState: BoardEditorToolState,
): PlayerToolState {
  const state = toolState[PLAYER_TOOL_ID] as
    | Partial<PlayerToolState>
    | undefined;

  return {
    draftStyle: {
      ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
      ...(state?.draftStyle ?? {}),
    },
    nextNumericLabelByColor:
      state?.nextNumericLabelByColor &&
      typeof state.nextNumericLabelByColor === "object"
        ? Object.fromEntries(
            Object.entries(state.nextNumericLabelByColor).filter(
              ([color, value]) =>
                typeof color === "string" && typeof value === "number",
            ),
          )
        : {},
  };
}
