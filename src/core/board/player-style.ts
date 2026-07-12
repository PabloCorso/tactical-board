import type { Asset, Board, PlayerCaptionStyle } from "./types";
import { getBoardPlayerGroup, resolvePlayerGroupStyle } from "./player-groups";
import {
  DEFAULT_PLAYER_COLOR,
  DEFAULT_PLAYER_FONT_SIZE,
  DEFAULT_PLAYER_SIZE,
  updatePlayerObject,
  type PlayerObject,
} from "../objects/player-object";

export type EffectivePlayerStyle = {
  color: string;
  colors?: Record<string, string>;
  size: number;
  fontSize: number;
  labelColor?: string;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaptionStyle;
};

export type PlayerStylePatch = Partial<{
  color: string;
  colors: Record<string, string>;
  size: number;
  fontSize: number;
  labelColor: string;
  appearanceId: string;
  options: Record<string, unknown>;
  asset: Asset;
  caption: PlayerCaptionStyle;
}>;

function getBuiltInPlayerStyle(): EffectivePlayerStyle {
  return {
    color: DEFAULT_PLAYER_COLOR,
    size: DEFAULT_PLAYER_SIZE,
    fontSize: DEFAULT_PLAYER_FONT_SIZE,
  };
}

function getPlayerStyleLayer(player: PlayerObject): PlayerStylePatch {
  const layer: PlayerStylePatch = {};

  if (player.props.color !== undefined) {
    layer.color = player.props.color;
  }
  if (player.props.colors !== undefined) {
    layer.colors = { ...player.props.colors };
  }
  if (player.size?.width !== undefined || player.size?.height !== undefined) {
    layer.size = player.size?.width ?? player.size?.height;
  }
  if (player.props.fontSize !== undefined) {
    layer.fontSize = player.props.fontSize;
  }
  if (player.props.labelColor !== undefined) {
    layer.labelColor = player.props.labelColor;
  }
  if (player.props.appearanceId !== undefined) {
    layer.appearanceId = player.props.appearanceId;
  }
  if (player.props.options !== undefined) {
    layer.options = { ...player.props.options };
  }
  if (player.props.asset !== undefined) {
    layer.asset = { ...player.props.asset };
  }
  if (player.props.caption?.style !== undefined) {
    layer.caption = { ...player.props.caption.style };
  }

  return layer;
}

function applyPlayerStyleLayer(
  style: EffectivePlayerStyle,
  layer: PlayerStylePatch | undefined,
) {
  if (!layer) {
    return style;
  }

  const next = { ...style };

  if (Object.prototype.hasOwnProperty.call(layer, "color")) {
    next.color = layer.color ?? DEFAULT_PLAYER_COLOR;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "colors")) {
    next.colors = layer.colors ? { ...layer.colors } : undefined;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "size")) {
    next.size = layer.size ?? DEFAULT_PLAYER_SIZE;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "fontSize")) {
    next.fontSize = layer.fontSize ?? DEFAULT_PLAYER_FONT_SIZE;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "labelColor")) {
    next.labelColor = layer.labelColor;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "appearanceId")) {
    next.appearanceId = layer.appearanceId;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "options")) {
    next.options = layer.options ? { ...layer.options } : undefined;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "asset")) {
    next.asset = layer.asset ? { ...layer.asset } : undefined;
  }
  if (Object.prototype.hasOwnProperty.call(layer, "caption")) {
    next.caption = layer.caption ? { ...layer.caption } : undefined;
  }

  return next;
}

export function resolveEffectivePlayerStyle(
  board: Pick<Board, "playerGroups">,
  player: PlayerObject,
): EffectivePlayerStyle {
  const group = getBoardPlayerGroup(board, player.props.groupId);
  const groupStyle = group ? resolvePlayerGroupStyle(group) : undefined;

  return applyPlayerStyleLayer(
    applyPlayerStyleLayer(getBuiltInPlayerStyle(), groupStyle),
    getPlayerStyleLayer(player),
  );
}

export function getPlayerWithEffectiveStyle(
  board: Pick<Board, "playerGroups">,
  player: PlayerObject,
): PlayerObject {
  const style = resolveEffectivePlayerStyle(board, player);

  return updatePlayerObject(player, {
    color: style.color,
    colors: style.colors,
    size: { width: style.size, height: style.size },
    fontSize: style.fontSize,
    labelColor: style.labelColor,
    appearanceId: style.appearanceId,
    options: style.options,
    asset: style.asset,
    caption:
      player.props.caption?.text !== undefined || style.caption
        ? {
            text: player.props.caption?.text,
            style: style.caption,
          }
        : undefined,
  });
}

export function updatePlayerStyle(
  player: PlayerObject,
  patch: PlayerStylePatch,
): PlayerObject {
  return updatePlayerObject(player, {
    ...("color" in patch ? { color: patch.color } : {}),
    ...("colors" in patch ? { colors: patch.colors } : {}),
    ...("size" in patch && typeof patch.size === "number"
      ? { size: { width: patch.size, height: patch.size } }
      : {}),
    ...("fontSize" in patch ? { fontSize: patch.fontSize } : {}),
    ...("labelColor" in patch ? { labelColor: patch.labelColor } : {}),
    ...("appearanceId" in patch ? { appearanceId: patch.appearanceId } : {}),
    ...("options" in patch ? { options: patch.options } : {}),
    ...("asset" in patch ? { asset: patch.asset } : {}),
    ...("caption" in patch
      ? {
          caption:
            player.props.caption?.text !== undefined || patch.caption
              ? {
                  text: player.props.caption?.text,
                  style: patch.caption,
                }
              : undefined,
        }
      : {}),
  });
}
