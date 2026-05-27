import { useMemo } from "react";
import type { Board } from "../../../../core/board/types";
import type { BoardEditorState } from "../../../../core/editor/types";
import type { AssetResolver } from "../../../../core/rendering/canvas/types";
import {
  createBoardEditorStore,
  type BoardEditorStore,
} from "../../../../core/store/board-editor-store";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorShapePolygonDone,
} from "../../../adapter/editor/board-editor";
import { BoardEditorSelectionToolbar } from "../../../board/editor/selection-toolbar/selection-toolbar";
import { BoardEditorToolbarDock } from "../../../board/editor/toolbar/editor-toolbar";
import { cn } from "../../../ui/misc";
import { SELECT_TOOL_ID } from "../../../../core/tools/select-tool-state";
import { createFootballBoard } from "../board/football-board";
import { FootballPrimaryToolbar } from "./football-primary-toolbar";
import { FootballSecondaryToolbar } from "./football-secondary-toolbar";
import { createFootballTools } from "../theme/football-tools";

export type FootballBoardEditorProps = {
  assetResolver?: AssetResolver;
  className?: string;
  extendBackground?: boolean;
  initialBoard?: Board;
  store?: BoardEditorStore;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

export type CreateFootballBoardEditorStoreOptions = {
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

export function createFootballBoardEditorStore(
  initialBoard: Board = createFootballBoard(),
  { navigationMode }: CreateFootballBoardEditorStoreOptions = {},
) {
  return createBoardEditorStore({
    initialBoard,
    initialToolId: SELECT_TOOL_ID,
    navigationMode,
    tools: createFootballTools(),
  });
}

export function FootballBoardEditor({
  assetResolver,
  className,
  extendBackground,
  initialBoard,
  store: providedStore,
  navigationMode,
}: FootballBoardEditorProps = {}) {
  const store = useMemo(
    () =>
      providedStore ??
      createFootballBoardEditorStore(initialBoard ?? createFootballBoard(), {
        navigationMode,
      }),
    [initialBoard, providedStore, navigationMode],
  );

  return (
    <BoardEditorProvider store={store}>
      <BoardEditor
        className={cn("relative h-dvh w-full overflow-hidden", className)}
      >
        <BoardEditorCanvas
          assetResolver={assetResolver}
          extendBackground={extendBackground}
        />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <BoardEditorToolbarDock
          reserveViewportInsets
          viewportInsetExtraSize={58}
        >
          <FootballPrimaryToolbar />
          <FootballSecondaryToolbar />
        </BoardEditorToolbarDock>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
