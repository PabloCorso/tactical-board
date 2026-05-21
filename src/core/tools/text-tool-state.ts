import type { Point } from "../board/types";
import type { BoardEditorToolState } from "../editor/types";
import {
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_FONT_SIZE,
} from "../objects/text-object";

export const TEXT_TOOL_ID = "text";

export type TextDraftStyle = {
  color: string;
  fontSize: number;
};

export type TextEditingSession = {
  objectId: string;
  anchorPosition: Point;
};

export type TextToolState = {
  draftStyle: TextDraftStyle;
  editingSession?: TextEditingSession;
};

export const DEFAULT_TEXT_TOOL_STATE: TextToolState = {
  draftStyle: {
    color: DEFAULT_TEXT_COLOR,
    fontSize: DEFAULT_TEXT_FONT_SIZE,
  },
  editingSession: undefined,
};

export function getTextToolState(
  toolState: BoardEditorToolState,
): TextToolState {
  const state = toolState[TEXT_TOOL_ID] as Partial<TextToolState> | undefined;

  return {
    draftStyle: {
      ...DEFAULT_TEXT_TOOL_STATE.draftStyle,
      ...(state?.draftStyle ?? {}),
    },
    editingSession: state?.editingSession,
  };
}
