import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Board } from "../core/board/types";
import type { BoardEditorState } from "../core/editor/types";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorSecondaryToolbar,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorToolbarDock,
  BoardEditorToolbarDockProvider,
  BoardPrimaryToolbar,
  basketballTheme,
  createBoardEditorStore,
  createBasketballBoard,
  createBasketballTools,
  useBoardEditorToolbarDock,
} from "../react";

type BasketballBoardStoryProps = {
  initialBoard?: Board;
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
};

function BasketballToolbarDockExample() {
  const toolbarDock = useBoardEditorToolbarDock();

  return (
    <BoardEditorToolbarDock>
      <div onClick={toolbarDock.openSecondaryToolbar}>
        <BoardPrimaryToolbar theme={basketballTheme} />
      </div>
      {toolbarDock.secondaryToolbarOpen ? (
        <BoardEditorSecondaryToolbar theme={basketballTheme} />
      ) : null}
    </BoardEditorToolbarDock>
  );
}

function BasketballBoardStory({
  initialBoard,
  navigationMode,
}: BasketballBoardStoryProps = {}) {
  const store = useMemo(
    () =>
      createBoardEditorStore({
        initialBoard: initialBoard ?? createBasketballBoard(),
        navigationMode,
        tools: createBasketballTools(),
      }),
    [initialBoard, navigationMode],
  );

  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <BoardEditorToolbarDockProvider>
          <BasketballToolbarDockExample />
        </BoardEditorToolbarDockProvider>
      </BoardEditor>
    </BoardEditorProvider>
  );
}

const meta = {
  title: "React/Board Editor/Basketball",
  component: BasketballBoardStory,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Second sport reference for the board editor. It reuses the generic editor, viewer renderers, player, arrow, shape, and text tools with a basketball court frame.",
      },
    },
  },
} satisfies Meta<typeof BasketballBoardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyBoard: Story = {};
