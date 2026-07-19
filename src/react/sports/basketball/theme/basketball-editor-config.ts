import { createBoardEditorConfig } from "../../../board/theme/create-board-editor-config";
import type { ObjectDefinition } from "../../../../core/objects/types";
import type { ToolDefinition } from "../../../../core/tools/types";
import { basketballTheme } from "./basketball-theme";

export function createBasketballEditorConfig(
  options: {
    objectDefinitions?: ObjectDefinition[];
    tools?: ToolDefinition[];
  } = {},
) {
  return createBoardEditorConfig({
    theme: basketballTheme,
    objectDefinitions: options.objectDefinitions,
    tools: options.tools,
  });
}
