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
import { ArrowTool } from "../../core/tools/arrow-tool";
import { HandTool } from "../../core/tools/hand-tool";
import { EquipmentTool } from "../../core/tools/equipment-tool";
import { PlayerTool, renderPlayer } from "../../core/tools/player-tool";
import { ShapeTool } from "../../core/tools/shape-tool";
import { SelectTool } from "../../core/tools/select-tool";
import { TextTool } from "../../core/tools/text-tool";
import { SELECT_TOOL_ID } from "../../core/tools/select-tool-state";
import type { CanvasObjectRenderInput } from "../../core/rendering/canvas/types";
import {
  DEFAULT_PLAYER_FONT_SIZE,
  type PlayerObject,
} from "../../core/objects/player-object";
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

type PlayerImageCacheEntry = {
  image: HTMLImageElement;
  loaded: boolean;
};

const playerImageCache = new Map<string, PlayerImageCacheEntry>();

function getPlayerImage(src: string, requestRender: () => void) {
  const cached = playerImageCache.get(src);

  if (cached) {
    return cached;
  }

  const image = new Image();
  const entry = {
    image,
    loaded: false,
  };

  image.onload = () => {
    entry.loaded = true;
    requestRender();
  };
  image.src = src;
  playerImageCache.set(src, entry);

  return entry;
}

function renderFootballPlayer(input: CanvasObjectRenderInput) {
  const player = input.object as PlayerObject;
  const imageSrc = player.props.meta?.imageSrc;

  if (typeof imageSrc !== "string" || typeof Image === "undefined") {
    renderPlayer(input);
    return;
  }

  const entry = getPlayerImage(imageSrc, input.requestRender);

  if (!entry.loaded) {
    renderPlayer(input);
    return;
  }

  const bounds = input.surfaceTransform.getObjectCanvasBounds(player);
  const width = Math.abs(bounds.width);
  const height = Math.abs(bounds.height);
  const radius = Math.min(width, height) / 2;

  input.context.save();
  input.context.globalAlpha = input.appearance === "preview" ? 0.55 : 1;
  input.context.translate(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  input.context.rotate(((player.rotation ?? 0) * Math.PI) / 180);
  input.context.beginPath();
  input.context.arc(0, 0, radius, 0, Math.PI * 2);
  input.context.clip();
  input.context.drawImage(entry.image, -width / 2, -height / 2, width, height);
  input.context.restore();

  if (player.props.label) {
    const fontSize =
      (player.props.fontSize ?? DEFAULT_PLAYER_FONT_SIZE) *
      input.surfaceTransform.scale;

    input.context.save();
    input.context.translate(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    input.context.fillStyle = "#ffffff";
    input.context.font = `700 ${fontSize}px "ui-rounded", "SF Pro Display", sans-serif`;
    input.context.textAlign = "center";
    input.context.textBaseline = "middle";
    input.context.shadowColor = "rgba(0, 0, 0, 0.55)";
    input.context.shadowBlur = 3;
    input.context.fillText(String(player.props.label), 0, 1);
    input.context.restore();
  }
}

const footballArrowTool = new ArrowTool({
  presets: FOOTBALL_ARROW_PRESETS.map(
    ({ variant: _variant, ...preset }) => preset,
  ),
});

const footballShapeTool = new ShapeTool({
  presets: FOOTBALL_SHAPE_PRESETS.map(
    ({ variant: _variant, ...preset }) => preset,
  ),
  defaultPreviewSize: {
    width: 128,
    height: 96,
  },
});

const footballPlayerTool = new PlayerTool({
  presets: FOOTBALL_PLAYER_PRESETS,
  renderer: renderFootballPlayer,
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
