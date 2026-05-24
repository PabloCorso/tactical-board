import {
  DEFAULT_PLAYER_FONT_SIZE,
  type PlayerObject,
} from "../../core/objects/player-object";
import type { CanvasObjectRenderInput } from "../../core/rendering/canvas/types";
import { ArrowTool } from "../../core/tools/arrow-tool";
import { EquipmentTool } from "../../core/tools/equipment-tool";
import { HandTool } from "../../core/tools/hand-tool";
import { PlayerTool, renderPlayer } from "../../core/tools/player-tool";
import { SelectTool } from "../../core/tools/select-tool";
import { ShapeTool } from "../../core/tools/shape-tool";
import { TextTool } from "../../core/tools/text-tool";
import type { ToolRegistration } from "../../core/tools/types";
import {
  FOOTBALL_EQUIPMENT_DEFINITIONS,
  FOOTBALL_EQUIPMENT_RENDERERS,
} from "./equipment";
import {
  FOOTBALL_ARROW_PRESETS,
  FOOTBALL_PLAYER_PRESETS,
  FOOTBALL_SHAPE_PRESETS,
} from "./football-catalog";
import { FOOTBALL_PITCH_TOOL_ID } from "./football-pitch-surface-icons";

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

export function renderFootballPlayer(input: CanvasObjectRenderInput) {
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

export function createFootballTools(): ToolRegistration[] {
  return [
    new SelectTool(),
    new HandTool(),
    new PlayerTool({
      presets: FOOTBALL_PLAYER_PRESETS,
      renderer: renderFootballPlayer,
    }),
    new EquipmentTool({
      definitions: FOOTBALL_EQUIPMENT_DEFINITIONS,
      renderersByKind: FOOTBALL_EQUIPMENT_RENDERERS,
    }),
    new TextTool(),
    new ArrowTool({
      presets: FOOTBALL_ARROW_PRESETS.map(
        ({ variant: _variant, ...preset }) => preset,
      ),
    }),
    new ShapeTool({
      presets: FOOTBALL_SHAPE_PRESETS.map(
        ({ variant: _variant, ...preset }) => preset,
      ),
      defaultPreviewSize: {
        width: 128,
        height: 96,
      },
    }),
    {
      id: FOOTBALL_PITCH_TOOL_ID,
      label: "Pitch",
    },
  ];
}
