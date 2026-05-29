import { useMemo } from "react";
import type { Board } from "../../../../core/board/types";
import type { BoardEditorState } from "../../../../core/editor/types";
import type { AssetResolver } from "../../../../core/rendering/canvas/types";
import type { BoardEditorStore } from "../../../../core/store/board-editor-store";
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
import { createFootballBoard } from "../board/football-board";
import { createFootballBoardEditorStore } from "./football-board-editor-store";
import { FootballPrimaryToolbar } from "./football-primary-toolbar";
import { FootballSecondaryToolbar } from "./football-secondary-toolbar";

export type FootballBoardEditorProps = {
  assetResolver?: AssetResolver;
  className?: string;
  extendBackground?: boolean;
  initialBoard?: Board;
  store?: BoardEditorStore;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

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
        <BoardEditorToolbarDock>
          <FootballPrimaryToolbar />
          <FootballSecondaryToolbar />
        </BoardEditorToolbarDock>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
