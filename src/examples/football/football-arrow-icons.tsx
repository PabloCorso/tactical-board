import { useMemo } from "react";
import { BoardEditorArrowIcon } from "../../react/components/board-editor-arrow-icon";
import { useBoardEditorContext } from "../../react/components/board-editor-context";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import {
  getArrowToolState,
  type ArrowDraftStyle,
} from "../../core/tools/arrow-tool-state";

export function FootballArrowPresetIcon({
  draftStyle,
  className = "h-5 w-10",
  width = 40,
  height = 20,
}: {
  draftStyle: Pick<
    ArrowDraftStyle,
    | "bodyStyle"
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
      draftStyle={draftStyle}
      className={className}
      width={width}
      height={height}
      layout="wide"
    />
  );
}

export function FootballArrowToolIcon() {
  const store = useBoardEditorContext();
  const rawArrowToolState = useBoardEditorStore(
    store,
    (state) => state.toolState.arrow,
  );
  const draftStyle = useMemo(
    () => getArrowToolState({ arrow: rawArrowToolState }).draftStyle,
    [rawArrowToolState],
  );

  return (
    <BoardEditorArrowIcon
      draftStyle={draftStyle}
      className="h-5 w-5 overflow-visible"
      width={20}
      height={20}
      layout="compact"
    />
  );
}
