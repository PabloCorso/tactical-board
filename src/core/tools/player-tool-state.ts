import type { BoardEditorToolState } from "../editor/types";
import {
  DEFAULT_PLAYER_COLOR,
  DEFAULT_PLAYER_FONT_SIZE,
  DEFAULT_PLAYER_SIZE,
} from "../objects/player-object";
import type { Asset, PlayerCaptionStyle } from "../board/types";

export const PLAYER_TOOL_ID = "player";

export type PlayerDraftStyle = {
  color: string;
  colors?: Record<string, string>;
  size: number;
  fontSize: number;
  labelColor?: string;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaptionStyle;
};

export type PlayerToolState = {
  activeGroupId?: string;
  draftStyle: PlayerDraftStyle;
};

export const DEFAULT_PLAYER_TOOL_STATE: PlayerToolState = {
  draftStyle: {
    color: DEFAULT_PLAYER_COLOR,
    size: DEFAULT_PLAYER_SIZE,
    fontSize: DEFAULT_PLAYER_FONT_SIZE,
  },
};

export function getPlayerToolState(
  toolState: BoardEditorToolState,
): PlayerToolState {
  const state = toolState[PLAYER_TOOL_ID] as
    | Partial<PlayerToolState>
    | undefined;

  return {
    activeGroupId: state?.activeGroupId,
    draftStyle: {
      ...DEFAULT_PLAYER_TOOL_STATE.draftStyle,
      ...(state?.draftStyle ?? {}),
      colors: state?.draftStyle?.colors
        ? { ...state.draftStyle.colors }
        : undefined,
      options: state?.draftStyle?.options
        ? { ...state.draftStyle.options }
        : undefined,
      asset: state?.draftStyle?.asset
        ? { ...state.draftStyle.asset }
        : undefined,
      caption: state?.draftStyle?.caption
        ? { ...state.draftStyle.caption }
        : undefined,
    },
  };
}
