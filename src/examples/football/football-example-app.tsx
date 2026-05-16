import { createBoardEditorStore } from "../../core/store/board-editor-store";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorShapePolygonDone,
} from "../../react/components/board-editor";
import { BoardEditorSelectionToolbar } from "../../react/components/board-editor-selection-toolbar";
import { BoardEditorToolControl } from "../../react/components/board-editor-tool-control";
import { BoardEditorToolbar } from "../../react/components/board-editor-toolbar";
import { ArrowTool } from "../../tools/arrow-tool";
import { HandTool } from "../../tools/hand-tool";
import { EquipmentTool } from "../../tools/equipment-tool";
import { PlayerTool } from "../../tools/player-tool";
import { ShapeTool } from "../../tools/shape-tool";
import { SelectTool } from "../../tools/select-tool";
import { TextTool } from "../../tools/text-tool";
import { SELECT_TOOL_ID } from "../../tools/select-tool-state";
import {
  FOOTBALL_EQUIPMENT_DEFINITIONS,
  FOOTBALL_EQUIPMENT_RENDERERS,
} from "./equipment";
import { footballBoardExample } from "./football-board-example";
import {
  FOOTBALL_ARROW_PRESETS,
  FOOTBALL_PLAYER_PRESETS,
  FOOTBALL_SHAPE_PRESETS,
  FootballSecondaryToolbar,
} from "./football-secondary-toolbar";
import {
  FootballArrowToolIcon,
  FootballEquipmentToolIcon,
  FootballPlayerToolIcon,
  FootballShapeToolIcon,
} from "./football-tool-icons";

const footballArrowTool = new ArrowTool({
  presets: FOOTBALL_ARROW_PRESETS.map(
    ({ variant: _variant, ...preset }) => preset,
  ),
});

const footballShapeTool = new ShapeTool({
  presets: FOOTBALL_SHAPE_PRESETS.map(
    ({ variant: _variant, ...preset }) => preset,
  ),
});

const footballPlayerTool = new PlayerTool({
  presets: FOOTBALL_PLAYER_PRESETS,
});

const footballEquipmentTool = new EquipmentTool({
  definitions: FOOTBALL_EQUIPMENT_DEFINITIONS,
  renderersByKind: FOOTBALL_EQUIPMENT_RENDERERS,
});
const textTool = new TextTool();
const selectTool = new SelectTool();
const handTool = new HandTool();

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: SELECT_TOOL_ID,
  tools: [
    selectTool,
    handTool,
    footballPlayerTool,
    footballEquipmentTool,
    textTool,
    footballArrowTool,
    footballShapeTool,
  ],
});

export function FootballExampleApp() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <BoardEditorToolbar className="flex-col">
              <BoardEditorToolControl toolId="select" />
              <BoardEditorToolControl toolId="hand" />
              <BoardEditorToolControl
                toolId="player"
                icon={<FootballPlayerToolIcon />}
              />
              <BoardEditorToolControl
                toolId="equipment"
                icon={<FootballEquipmentToolIcon />}
              />
              <BoardEditorToolControl toolId="text" />
              <BoardEditorToolControl
                toolId="arrow"
                icon={<FootballArrowToolIcon />}
              />
              <BoardEditorToolControl
                toolId="shape"
                icon={<FootballShapeToolIcon />}
              />
            </BoardEditorToolbar>
            <FootballSecondaryToolbar className="flex-col" />
          </div>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
