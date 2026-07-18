import type { BoardEditorState } from "../editor/types";
import type { SelectionPresentation } from "./selection-presentation";

export abstract class BoardEditorTool {
  abstract readonly id: string;
  abstract readonly label: string;

  getSelectionPresentation(_state: BoardEditorState): SelectionPresentation {
    return "passive";
  }
}
