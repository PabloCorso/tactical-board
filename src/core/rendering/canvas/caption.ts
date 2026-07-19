import type { CaptionBackgroundStyle } from "../../board/types";

export const CANVAS_CAPTION_HEIGHT_FACTOR = 1.35;
export const CANVAS_CAPTION_HORIZONTAL_PADDING_FACTOR = 0.4;
const CANVAS_CAPTION_RADIUS_FACTOR = 0.3;
const CANVAS_CAPTION_FONT_FAMILY = "ui-sans-serif, system-ui, sans-serif";
const CANVAS_CAPTION_FONT_WEIGHT = 600;
const FALLBACK_CAPTION_WIDTH_FACTOR = 0.58;

let captionMeasurementContext: CanvasRenderingContext2D | null | undefined;

export type CanvasCaptionStyle = {
  fontSize: number;
  color: string;
  backgroundStyle: CaptionBackgroundStyle;
  backgroundColor: string;
};

export function getCanvasCaptionFont(fontSize: number) {
  return `${CANVAS_CAPTION_FONT_WEIGHT} ${fontSize}px ${CANVAS_CAPTION_FONT_FAMILY}`;
}

export function getCanvasCaptionTextWidth(text: string, fontSize: number) {
  if (captionMeasurementContext === undefined) {
    captionMeasurementContext =
      typeof document === "undefined"
        ? null
        : document.createElement("canvas").getContext("2d");
  }

  if (!captionMeasurementContext) {
    return text.length * fontSize * FALLBACK_CAPTION_WIDTH_FACTOR;
  }

  captionMeasurementContext.font = getCanvasCaptionFont(fontSize);

  return captionMeasurementContext.measureText(text).width;
}

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
  context.font = getCanvasCaptionFont(style.fontSize);
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
