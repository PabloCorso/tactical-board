import { BOARD_PLAYER_DEFAULTS } from "../../../board/theme/board-tool-defaults";
import { createBoardEditorConfig } from "../../../board/theme/create-board-editor-config";
import type { ObjectDefinition } from "../../../../core/objects/types";
import type { ToolDefinition } from "../../../../core/tools/types";
import { DEFAULT_FOOTBALL_PLAYER_SIZE } from "../board/football-units";
import { FOOTBALL_ARROW_DEFAULTS } from "./football-arrow-defaults";
import { FOOTBALL_PITCH_TOOL_ID } from "./football-pitch-options";
import { footballTheme, footballThemeAdapters } from "./football-theme";
import type { Board } from "../../../../core/board/types";
import {
  createBoardEditorInstance,
  type CreateBoardEditorInstanceOptions,
} from "../../../adapter/editor/board-editor-instance";
import { createFootballBoard } from "../board/football-board";

export function createFootballEditorConfig(
  options: {
    objectDefinitions?: ObjectDefinition[];
    tools?: ToolDefinition[];
  } = {},
) {
  return createBoardEditorConfig({
    adapters: footballThemeAdapters,
    theme: footballTheme,
    objectDefinitions: options.objectDefinitions,
    defaults: {
      arrows: FOOTBALL_ARROW_DEFAULTS,
      players: BOARD_PLAYER_DEFAULTS.map((playerDefault) => ({
        ...playerDefault,
        draftStyle: {
          ...playerDefault.draftStyle,
          size: DEFAULT_FOOTBALL_PLAYER_SIZE,
        },
      })),
      shapePreviewSize: {
        width: 128,
        height: 96,
      },
    },
    tools: [
      {
        id: FOOTBALL_PITCH_TOOL_ID,
        label: "Pitch",
      },
      ...(options.tools ?? []),
    ],
  });
}

export type CreateFootballBoardEditorOptions = Omit<
  CreateBoardEditorInstanceOptions,
  "config" | "initialBoard"
> & {
  initialBoard?: Board;
  objectDefinitions?: ObjectDefinition[];
  tools?: ToolDefinition[];
};

export function createFootballBoardEditor({
  initialBoard = createFootballBoard(),
  objectDefinitions,
  tools,
  ...options
}: CreateFootballBoardEditorOptions = {}) {
  return createBoardEditorInstance({
    ...options,
    config: createFootballEditorConfig({ objectDefinitions, tools }),
    initialBoard,
  });
}
