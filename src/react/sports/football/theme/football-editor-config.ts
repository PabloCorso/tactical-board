import { BOARD_PLAYER_DEFAULTS } from "../../../board/theme/board-tool-defaults";
import { createBoardEditorConfig } from "../../../board/theme/create-board-editor-config";
import { DEFAULT_FOOTBALL_PLAYER_SIZE } from "../board/football-units";
import { FOOTBALL_ARROW_DEFAULTS } from "./football-arrow-defaults";
import { FOOTBALL_PITCH_TOOL_ID } from "./football-pitch-options";
import { footballTheme, footballThemeAdapters } from "./football-theme";

export function createFootballEditorConfig() {
  return createBoardEditorConfig({
    adapters: footballThemeAdapters,
    theme: footballTheme,
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
      extraTools: [
        {
          id: FOOTBALL_PITCH_TOOL_ID,
          label: "Pitch",
        },
      ],
    },
  });
}
