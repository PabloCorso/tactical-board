import { useMemo } from "react";
import type { Board } from "../../../../core/board/types";
import type { BoardEditorState } from "../../../../core/editor/types";
import type { AssetResolver } from "../../../../core/rendering/canvas/types";
import {
  createBoardEditorStore,
  type BoardEditorStore,
} from "../../../../core/store/board-editor-store";
import { SELECT_TOOL_ID } from "../../../../core/tools/select-tool-state";
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
import { BoardSecondaryToolbar } from "../../../board/toolbar/secondary-toolbar";
import { createBasketballBoard } from "../board/basketball-board";
import { BasketballPrimaryToolbar } from "./basketball-primary-toolbar";
import { createBasketballTools } from "../theme/basketball-tools";

export type BasketballBoardEditorProps = {
  assetResolver?: AssetResolver;
  className?: string;
  extendBackground?: boolean;
  initialBoard?: Board;
  store?: BoardEditorStore;
  fitPadding?: number;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

export type CreateBasketballBoardEditorStoreOptions = {
  fitPadding?: number;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

export function createBasketballBoardEditorStore(
  initialBoard: Board = createBasketballBoard(),
  {
    fitPadding,
    navigationMode = "contained",
  }: CreateBasketballBoardEditorStoreOptions = {},
) {
  return createBoardEditorStore({
    initialBoard,
    initialToolId: SELECT_TOOL_ID,
    fitPadding,
    navigationMode,
    tools: createBasketballTools(),
  });
}

export function BasketballBoardEditor({
  assetResolver,
  className,
  extendBackground,
  initialBoard,
  store: providedStore,
  fitPadding,
  navigationMode,
}: BasketballBoardEditorProps = {}) {
  const store = useMemo(
    () =>
      providedStore ??
      createBasketballBoardEditorStore(
        initialBoard ?? createBasketballBoard(),
        {
          fitPadding,
          navigationMode,
        },
      ),
    [initialBoard, providedStore, fitPadding, navigationMode],
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
          <BasketballPrimaryToolbar />
          <BoardSecondaryToolbar />
        </BoardEditorToolbarDock>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
