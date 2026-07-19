import type { BoardTheme } from "../../../board/theme/board-theme";
import { createBasketballCourt } from "../board/basketball-board";

export const basketballTheme: BoardTheme = {
  id: "basketball",
  name: "Basketball",
  frames: [createBasketballCourt()],
};
