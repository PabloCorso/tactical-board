import { useMemo } from "react";
import type { BoardEditorState } from "../../../core/editor/types";
import { ArrowTool } from "../../../core/tools/arrow-tool";
import {
  ARROW_TOOL_ID,
  getArrowToolState,
  type ArrowDraftStyle,
} from "../../../core/tools/arrow-tool-state";
import { useBoardEditorContext } from "../../adapter/editor/board-editor-context";
import { useBoardEditorStore } from "../../adapter/editor/use-board-editor-store";
import { cn } from "../../ui/misc";
import { BoardEditorArrowIcon } from "../editor/arrow-icon";
import { getThemeAwareToolIconColor } from "./tool-icon-color";

export function BoardArrowDefaultIcon({
  draftStyle,
  className,
  width = 24,
  height = 24,
}: {
  draftStyle: Pick<
    ArrowDraftStyle,
    | "kind"
    | "color"
    | "strokeWidth"
    | "lineStyle"
    | "dashStyle"
    | "startHead"
    | "endHead"
  >;
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <BoardEditorArrowIcon
      draftStyle={{
        ...draftStyle,
        color: getThemeAwareToolIconColor(draftStyle.color),
      }}
      className={cn("h-6 w-6 overflow-visible", className)}
      width={width}
      height={height}
      layout="compact"
    />
  );
}

export function BoardArrowToolIcon() {
  const store = useBoardEditorContext();
  const toolRegistry = useBoardEditorStore(
    store,
    (state) => state.toolRegistry,
  );
  const toolState = useBoardEditorStore(store, (state) => state.toolState);
  const draftStyle = useMemo(
    () => getArrowToolIconDraftStyle({ toolRegistry, toolState }),
    [toolRegistry, toolState],
  );

  return <BoardArrowDefaultIcon draftStyle={draftStyle} />;
}

export function getArrowToolIconDraftStyle(
  state: Pick<BoardEditorState, "toolRegistry" | "toolState">,
) {
  const arrowTool = state.toolRegistry.definitions[ARROW_TOOL_ID];

  if (arrowTool instanceof ArrowTool) {
    return arrowTool.getActivatedDraftStyle(state.toolState);
  }

  return getArrowToolState(state.toolState).draftStyle;
}
