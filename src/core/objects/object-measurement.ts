import type { CaptionStyle } from "../board/types";
import { getContrastingTextColor } from "../colors/contrast";

export const DEFAULT_OBJECT_MEASUREMENT_FONT_SIZE = 12;
export const DEFAULT_OBJECT_MEASUREMENT_TEXT_COLOR = "#ffffff";
export const DEFAULT_OBJECT_MEASUREMENT_BACKGROUND_COLOR = "#18181b";
export const DEFAULT_OBJECT_MEASUREMENT_DISTANCE = 4;

export type ObjectMeasurementStyle = CaptionStyle;

export interface ObjectMeasurement {
  visible: boolean;
  style?: ObjectMeasurementStyle;
}

export function cloneObjectMeasurement(
  measurement?: ObjectMeasurement,
): ObjectMeasurement | undefined {
  if (!measurement) {
    return undefined;
  }

  return {
    visible: Boolean(measurement.visible),
    style: measurement.style ? { ...measurement.style } : undefined,
  };
}

export function resolveObjectMeasurementStyle(
  measurement?: ObjectMeasurement,
  objectColor = DEFAULT_OBJECT_MEASUREMENT_BACKGROUND_COLOR,
): Required<ObjectMeasurementStyle> {
  const backgroundStyle = measurement?.style?.backgroundStyle ?? "solid";
  const backgroundColor = measurement?.style?.backgroundColor ?? objectColor;

  return {
    fontSize:
      measurement?.style?.fontSize ?? DEFAULT_OBJECT_MEASUREMENT_FONT_SIZE,
    color:
      measurement?.style?.color ??
      (backgroundStyle === "solid"
        ? getContrastingTextColor(backgroundColor)
        : objectColor),
    placement: measurement?.style?.placement ?? "bottom",
    distance:
      measurement?.style?.distance ?? DEFAULT_OBJECT_MEASUREMENT_DISTANCE,
    backgroundStyle,
    backgroundColor,
  };
}
