import { createBoardObjectRenderers } from "../../../board/theme/create-board-object-renderers";
import type { BoardTheme } from "../../../board/theme/board-theme";
import { createBasketballCourt } from "../board/basketball-board";

export const basketballTheme = {
  frames: [createBasketballCourt()],
  objectRenderers: createBoardObjectRenderers(),
} satisfies BoardTheme;
