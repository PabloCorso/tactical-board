import type { ToolRegistration } from "../../../../core/tools/types";
import { createBoardTools } from "../../../board/theme/create-board-tools";

export function createBasketballTools(): ToolRegistration[] {
  return createBoardTools();
}
