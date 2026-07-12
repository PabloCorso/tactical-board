import type { ToolRegistration } from "../../../../core/tools/types";
import { BOARD_PLAYER_DEFAULTS } from "../../../board/theme/board-tool-defaults";
import { createBoardTools } from "../../../board/theme/create-board-tools";
import { DEFAULT_FOOTBALL_PLAYER_SIZE } from "../board/football-units";
import { FOOTBALL_PITCH_TOOL_ID } from "./football-pitch-options";
import { footballTheme, footballThemeAdapters } from "./football-theme";

export function createFootballTools(): ToolRegistration[] {
  return createBoardTools({
    adapters: footballThemeAdapters,
    theme: footballTheme,
    defaults: {
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
      extraTools: [
        {
          id: FOOTBALL_PITCH_TOOL_ID,
          label: "Pitch",
        },
      ],
    },
  });
}
