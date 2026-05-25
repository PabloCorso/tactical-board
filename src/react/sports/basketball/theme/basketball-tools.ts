import type { ToolRegistration } from "../../../../core/tools/types";
import { createBoardTools } from "../../../board/theme/create-board-tools";
import { basketballTheme } from "./basketball-theme";

export function createBasketballTools(): ToolRegistration[] {
  return createBoardTools({ theme: basketballTheme });
}
