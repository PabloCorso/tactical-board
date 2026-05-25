import type { BoardTheme } from "../../../board/theme/board-theme";
import { createFootballPitch } from "../board/football-board";
import {
  FOOTBALL_EQUIPMENT_DEFINITIONS,
  FOOTBALL_EQUIPMENT_RENDERERS,
} from "../equipment";
import { createBoardObjectRenderers } from "../../../board/theme/create-board-object-renderers";

export const footballTheme = {
  frames: [
    createFootballPitch("full-pitch"),
    createFootballPitch("half-pitch"),
    createFootballPitch("reduced-space"),
  ],
  equipment: {
    definitions: FOOTBALL_EQUIPMENT_DEFINITIONS,
    renderersByKind: FOOTBALL_EQUIPMENT_RENDERERS,
  },
  objectRenderers: createBoardObjectRenderers({
    equipment: {
      definitions: FOOTBALL_EQUIPMENT_DEFINITIONS,
      renderersByKind: FOOTBALL_EQUIPMENT_RENDERERS,
    },
  }),
} satisfies BoardTheme;
