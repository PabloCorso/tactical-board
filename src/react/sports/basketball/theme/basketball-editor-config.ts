import { createBoardEditorConfig } from "../../../board/theme/create-board-editor-config";
import { basketballTheme } from "./basketball-theme";

export function createBasketballEditorConfig() {
  return createBoardEditorConfig({ theme: basketballTheme });
}
