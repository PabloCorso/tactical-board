import type { ObjectId } from "../board/types";
import type { ToolApi } from "./types";

export type CreationCompletionBehavior = "continue-creating" | "select-created";

export const DEFAULT_CREATION_COMPLETION_BEHAVIOR: CreationCompletionBehavior =
  "continue-creating";

export function applyCreationCompletion(
  api: ToolApi,
  createdObjectIds: ObjectId[],
  behavior: CreationCompletionBehavior = DEFAULT_CREATION_COMPLETION_BEHAVIOR,
) {
  if (behavior !== "select-created" || createdObjectIds.length === 0) {
    return;
  }

  api.resetTool();
  api.setSelectedObjectIds(createdObjectIds);
}
