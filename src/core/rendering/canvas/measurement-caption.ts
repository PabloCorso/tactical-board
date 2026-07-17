import {
  resolveObjectMeasurementStyle,
  type ObjectMeasurement,
} from "../../objects/object-measurement";
import { CANVAS_CAPTION_HEIGHT_FACTOR, drawCanvasCaption } from "./caption";

const MIN_CAPTION_FONT_SIZE_PX = 6;

export { getUprightCanvasTextAngle } from "./caption";

export function getCanvasMeasurementStyle(
  measurement: ObjectMeasurement,
  scale: number,
  objectColor?: string,
) {
  const style = resolveObjectMeasurementStyle(measurement, objectColor);

  return {
    ...style,
    fontSize: Math.max(style.fontSize * scale, MIN_CAPTION_FONT_SIZE_PX),
  };
}

export function getCanvasMeasurementCaptionOffset(
  measurement: ObjectMeasurement,
  scale: number,
) {
  const style = getCanvasMeasurementStyle(measurement, scale);
  return (
    (style.fontSize * CANVAS_CAPTION_HEIGHT_FACTOR) / 2 + style.distance * scale
  );
}

export function drawCanvasMeasurementCaption({
  anchor,
  context,
  measurement,
  objectColor,
  rotation = 0,
  scale,
  text,
}: {
  anchor: { x: number; y: number };
  context: CanvasRenderingContext2D;
  measurement: ObjectMeasurement;
  objectColor?: string;
  rotation?: number;
  scale: number;
  text: string;
}) {
  drawCanvasCaption({
    anchor,
    context,
    rotation,
    style: getCanvasMeasurementStyle(measurement, scale, objectColor),
    text,
  });
}
