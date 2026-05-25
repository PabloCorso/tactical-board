import type { ToolRegistration } from "../../../../core/tools/types";
import { createBoardTools } from "../../../board/theme/create-board-tools";
import { FOOTBALL_PITCH_TOOL_ID } from "./football-pitch-icons";
import { footballTheme, footballThemeAdapters } from "./football-theme";

export function createFootballTools(): ToolRegistration[] {
  return createBoardTools({
    adapters: footballThemeAdapters,
    theme: footballTheme,
    defaults: {
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
