import type { BoardTheme } from "../../../board/theme/board-theme";
import { resolveBoardTheme } from "../../../board/theme/resolve-board-theme";
import { createBasketballCourt } from "../board/basketball-board";

export const basketballTheme = {
  id: "basketball",
  name: "Basketball",
  frames: [createBasketballCourt()],
} satisfies BoardTheme;

export const resolvedBasketballTheme = resolveBoardTheme({
  theme: basketballTheme,
});
