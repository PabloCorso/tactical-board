import type { BoardTheme } from "../../../board/theme/board-theme";
import { resolveBoardTheme } from "../../../board/theme/resolve-board-theme";
import { createBasketballCourt } from "../board/basketball-board";

export const basketballTheme: BoardTheme = {
  id: "basketball",
  name: "Basketball",
  frames: [createBasketballCourt()],
};

export const resolvedBasketballTheme = resolveBoardTheme({
  theme: basketballTheme,
});
