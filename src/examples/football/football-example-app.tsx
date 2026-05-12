import { createBoardEditorStore } from "../../core/store/board-editor-store";
import {
  BoardEditor,
  BoardEditorArrowRouteDone,
  BoardEditorCanvas,
  BoardEditorProvider,
} from "../../react/components/board-editor";
import { BoardEditorSelectionToolbar } from "../../react/components/board-editor-selection-toolbar";
import { BoardEditorSecondaryToolbar } from "../../react/components/board-editor-secondary-toolbar";
import { BoardEditorToolControl } from "../../react/components/board-editor-tool-control";
import { BoardEditorToolbar } from "../../react/components/board-editor-toolbar";
import { createArrowTool } from "../../tools/arrow-tool";
import { handTool } from "../../tools/hand-tool";
import { selectTool } from "../../tools/select-tool";
import { footballBoardExample } from "./football-board-example";

const footballArrowTool = createArrowTool({
  presets: [
    {
      id: "run",
      label: "Run",
      iconId: "arrow-straight-solid",
      draftStyle: {
        geometry: "simple",
        bodyStyle: "straight",
      },
    },
    {
      id: "dribble",
      label: "Dribble",
      iconId: "arrow-wavy",
      draftStyle: {
        geometry: "simple",
        bodyStyle: "wavy",
      },
    },
    {
      id: "lofted-pass",
      label: "Lofted pass",
      iconId: "arrow-curved-solid",
      draftStyle: {
        geometry: "simple",
        bodyStyle: "curved",
      },
    },
    {
      id: "screen",
      label: "Screen",
      iconId: "arrow-double",
      draftStyle: {
        geometry: "simple",
        bodyStyle: "double",
      },
    },
    {
      id: "route",
      label: "Route",
      iconId: "arrow-polyline",
      draftStyle: {
        geometry: "polyline",
        bodyStyle: "straight",
      },
    },
  ],
});

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: selectTool.id,
  tools: [selectTool, footballArrowTool, handTool],
});

export function FootballExampleApp() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorArrowRouteDone />
        <BoardEditorSelectionToolbar />
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <BoardEditorToolbar className="flex-col">
              <BoardEditorToolControl toolId="select" />
              <BoardEditorToolControl toolId="hand" />
              <BoardEditorToolControl toolId="arrow" />
            </BoardEditorToolbar>
            <BoardEditorSecondaryToolbar className="flex-col" />
          </div>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
