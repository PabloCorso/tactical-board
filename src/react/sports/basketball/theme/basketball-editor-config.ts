import { createBoardEditorConfig } from "../../../board/theme/create-board-editor-config";
import type { ObjectDefinition } from "../../../../core/objects/types";
import type { ToolDefinition } from "../../../../core/tools/types";
import { basketballTheme } from "./basketball-theme";
import type { Board } from "../../../../core/board/types";
import {
  createBoardEditorInstance,
  type CreateBoardEditorInstanceOptions,
} from "../../../adapter/editor/board-editor-instance";
import { createBasketballBoard } from "../board/basketball-board";

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

export type CreateBasketballBoardEditorOptions = Omit<
  CreateBoardEditorInstanceOptions,
  "config" | "initialBoard"
> & {
  initialBoard?: Board;
  objectDefinitions?: ObjectDefinition[];
  tools?: ToolDefinition[];
};

export function createBasketballBoardEditor({
  initialBoard = createBasketballBoard(),
  objectDefinitions,
  tools,
  ...options
}: CreateBasketballBoardEditorOptions = {}) {
  return createBoardEditorInstance({
    ...options,
    config: createBasketballEditorConfig({ objectDefinitions, tools }),
    initialBoard,
  });
}
