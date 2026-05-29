import type { FitPadding } from "../geometry/types";
import type { BoardEditorState } from "./types";

export function resolveBoardEditorFitPadding(
  state: Pick<BoardEditorState, "board" | "ui">,
): FitPadding | undefined {
  const padding = state.ui.fitPadding;

  return typeof padding === "function" ? padding(state.board.frame) : padding;
}
