import type { CaptionBackgroundStyle } from "../../board/types";

export const CANVAS_CAPTION_HEIGHT_FACTOR = 1.35;
export const CANVAS_CAPTION_HORIZONTAL_PADDING_FACTOR = 0.4;
const CANVAS_CAPTION_RADIUS_FACTOR = 0.3;

export type CanvasCaptionStyle = {
  fontSize: number;
  color: string;
  backgroundStyle: CaptionBackgroundStyle;
  backgroundColor: string;
};

export function getUprightCanvasTextAngle(angle: number) {
  const fullTurn = Math.PI * 2;
  let normalized =
    ((((angle + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI;

  if (normalized > Math.PI / 2) {
    normalized -= Math.PI;
  } else if (normalized < -Math.PI / 2) {
    normalized += Math.PI;
  }

  return normalized;
}

export function drawCanvasCaption({
  anchor,
  context,
  rotation = 0,
  style,
  text,
}: {
  anchor: { x: number; y: number };
  context: CanvasRenderingContext2D;
  rotation?: number;
  style: CanvasCaptionStyle;
  text: string;
}) {
  const height = style.fontSize * CANVAS_CAPTION_HEIGHT_FACTOR;
  const horizontalPadding =
    style.fontSize * CANVAS_CAPTION_HORIZONTAL_PADDING_FACTOR;

  context.save();
  context.translate(anchor.x, anchor.y);
  context.rotate(getUprightCanvasTextAngle(rotation));
  context.font = `600 ${style.fontSize}px ui-sans-serif, system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const width = context.measureText(text).width + horizontalPadding * 2;

  if (style.backgroundStyle === "solid") {
    context.fillStyle = style.backgroundColor;
    context.beginPath();
    context.roundRect(
      -width / 2,
      -height / 2,
      width,
      height,
      style.fontSize * CANVAS_CAPTION_RADIUS_FACTOR,
    );
    context.fill();
  }

  context.fillStyle = style.color;
  context.fillText(text, 0, style.fontSize * 0.04);
  context.restore();
}
