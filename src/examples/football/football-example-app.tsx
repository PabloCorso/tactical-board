import { createBoardEditorStore } from "../../core/store/board-editor-store";
import {
  BoardEditor,
  BoardEditorArrowRouteDone,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorShapePolygonDone,
} from "../../react/components/board-editor";
import { BoardEditorSelectionToolbar } from "../../react/components/board-editor-selection-toolbar";
import { BoardEditorSecondaryToolbar } from "../../react/components/board-editor-secondary-toolbar";
import { BoardEditorToolControl } from "../../react/components/board-editor-tool-control";
import { BoardEditorToolbar } from "../../react/components/board-editor-toolbar";
import { createArrowTool } from "../../tools/arrow-tool";
import { handTool } from "../../tools/hand-tool";
import { createEquipmentTool } from "../../tools/equipment-tool";
import { createPlayerTool } from "../../tools/player-tool";
import { createShapeTool } from "../../tools/shape-tool";
import { selectTool } from "../../tools/select-tool";
import {
  FOOTBALL_EQUIPMENT_DEFINITIONS,
  FOOTBALL_EQUIPMENT_RENDERERS,
} from "./equipment";
import {
  FOOTBALL_PLAYER_PRESET_COLORS,
} from "./football-example-catalog";
import { footballBoardExample } from "./football-board-example";

const footballArrowTool = createArrowTool({
  presets: [
    {
      id: "run",
      label: "Run",
      icon: { kind: "arrow", value: "straight-solid" },
      draftStyle: {
        geometry: "simple",
        bodyStyle: "straight",
      },
    },
    {
      id: "dribble",
      label: "Dribble",
      icon: { kind: "arrow", value: "wavy" },
      draftStyle: {
        geometry: "simple",
        bodyStyle: "wavy",
      },
    },
    {
      id: "lofted-pass",
      label: "Lofted pass",
      icon: { kind: "arrow", value: "curved-solid" },
      draftStyle: {
        geometry: "simple",
        bodyStyle: "curved",
      },
    },
    {
      id: "screen",
      label: "Screen",
      icon: { kind: "arrow", value: "double" },
      draftStyle: {
        geometry: "simple",
        bodyStyle: "double",
      },
    },
    {
      id: "route",
      label: "Route",
      icon: { kind: "arrow", value: "polyline" },
      draftStyle: {
        geometry: "polyline",
        bodyStyle: "straight",
      },
    },
  ],
});

const footballShapeTool = createShapeTool({
  presets: [
    {
      id: "shape-rectangle",
      label: "Rectangle",
      icon: { kind: "shape", value: "rectangle" },
      draftStyle: {
        kind: "rectangle",
      },
    },
    {
      id: "shape-oval",
      label: "Oval",
      icon: { kind: "shape", value: "oval" },
      draftStyle: {
        kind: "oval",
      },
    },
    {
      id: "shape-triangle",
      label: "Triangle",
      icon: { kind: "shape", value: "triangle" },
      draftStyle: {
        kind: "triangle",
      },
    },
    {
      id: "shape-diamond",
      label: "Diamond",
      icon: { kind: "shape", value: "diamond" },
      draftStyle: {
        kind: "diamond",
      },
    },
    {
      id: "shape-polygon",
      label: "Polygon",
      icon: { kind: "shape", value: "polygon" },
      draftStyle: {
        kind: "polygon",
      },
    },
  ],
});

const footballPlayerTool = createPlayerTool({
  presets: FOOTBALL_PLAYER_PRESET_COLORS.map((color, index) => ({
    id: `team-color-${index + 1}`,
    label: String(index + 1),
    tooltip: `Player color ${color}`,
    draftStyle: {
      color,
    },
  })),
});

const footballEquipmentTool = createEquipmentTool({
  definitions: FOOTBALL_EQUIPMENT_DEFINITIONS,
  renderersByKind: FOOTBALL_EQUIPMENT_RENDERERS,
});

const store = createBoardEditorStore({
  initialBoard: footballBoardExample,
  initialToolId: selectTool.id,
  tools: [
    selectTool,
    handTool,
    footballPlayerTool,
    footballEquipmentTool,
    footballArrowTool,
    footballShapeTool,
  ],
});

export function FootballExampleApp() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorArrowRouteDone />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <BoardEditorToolbar className="flex-col">
              <BoardEditorToolControl toolId="select" />
              <BoardEditorToolControl toolId="hand" />
              <BoardEditorToolControl toolId="player" />
              <BoardEditorToolControl toolId="equipment" />
              <BoardEditorToolControl toolId="arrow" />
              <BoardEditorToolControl toolId="shape" />
            </BoardEditorToolbar>
            <BoardEditorSecondaryToolbar className="flex-col" />
          </div>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
