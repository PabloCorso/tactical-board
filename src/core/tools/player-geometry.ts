import type { PlayerObject } from "../objects/player-object";
import type { Rect } from "../geometry/types";

const DEFAULT_CAPTION_DISTANCE = 4;
const CAPTION_WIDTH_FACTOR = 0.58;
const CAPTION_HIT_PADDING_PX = 3;

type PlayerGeometryProjection = {
  scale: number;
  getObjectCanvasBounds: (object: PlayerObject) => Rect;
};

export function getPlayerMarkerCanvasBounds(
  player: PlayerObject,
  projection: PlayerGeometryProjection,
) {
  return projection.getObjectCanvasBounds(player);
}

export function getPlayerCaptionText(player: PlayerObject) {
  const text = player.props.caption?.text;

  return typeof text === "string" && text.trim().length > 0 ? text : undefined;
}

export function getPlayerCaptionCanvasFontSize(
  player: PlayerObject,
  projection: PlayerGeometryProjection,
) {
  const configuredFontSize =
    player.props.caption?.style?.fontSize ?? player.props.fontSize;

  return Math.max(configuredFontSize * projection.scale, 6);
}

export function getPlayerCaptionCanvasBounds(
  player: PlayerObject,
  projection: PlayerGeometryProjection,
): Rect | undefined {
  const text = getPlayerCaptionText(player);

  if (!text) {
    return undefined;
  }

  const markerBounds = getPlayerMarkerCanvasBounds(player, projection);
  const centerX = markerBounds.x + markerBounds.width / 2;
  const centerY = markerBounds.y + markerBounds.height / 2;
  const fontSize = getPlayerCaptionCanvasFontSize(player, projection);
  const width = Math.max(
    fontSize,
    text.length * fontSize * CAPTION_WIDTH_FACTOR,
  );
  const height = fontSize * 1.25;
  const distance =
    (player.props.caption?.style?.distance ?? DEFAULT_CAPTION_DISTANCE) *
    projection.scale;
  const placement = player.props.caption?.style?.placement ?? "bottom";

  if (placement === "top") {
    return {
      x: centerX - width / 2,
      y: markerBounds.y - distance - height,
      width,
      height,
    };
  }

  if (placement === "right") {
    return {
      x: markerBounds.x + markerBounds.width + distance,
      y: centerY - height / 2,
      width,
      height,
    };
  }

  if (placement === "left") {
    return {
      x: markerBounds.x - distance - width,
      y: centerY - height / 2,
      width,
      height,
    };
  }

  return {
    x: centerX - width / 2,
    y: markerBounds.y + markerBounds.height + distance,
    width,
    height,
  };
}

export function getPlayerVisibleCanvasBounds(
  player: PlayerObject,
  projection: PlayerGeometryProjection,
) {
  const markerBounds = getPlayerMarkerCanvasBounds(player, projection);
  const captionBounds = getPlayerCaptionCanvasBounds(player, projection);

  if (!captionBounds) {
    return markerBounds;
  }

  const left = Math.min(markerBounds.x, captionBounds.x);
  const top = Math.min(markerBounds.y, captionBounds.y);
  const right = Math.max(
    markerBounds.x + markerBounds.width,
    captionBounds.x + captionBounds.width,
  );
  const bottom = Math.max(
    markerBounds.y + markerBounds.height,
    captionBounds.y + captionBounds.height,
  );

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export function hitTestPlayerCaption(
  player: PlayerObject,
  projection: PlayerGeometryProjection,
  canvasPoint: { x: number; y: number },
) {
  const bounds = getPlayerCaptionCanvasBounds(player, projection);

  if (!bounds) {
    return false;
  }

  return (
    canvasPoint.x >= bounds.x - CAPTION_HIT_PADDING_PX &&
    canvasPoint.x <= bounds.x + bounds.width + CAPTION_HIT_PADDING_PX &&
    canvasPoint.y >= bounds.y - CAPTION_HIT_PADDING_PX &&
    canvasPoint.y <= bounds.y + bounds.height + CAPTION_HIT_PADDING_PX
  );
}
