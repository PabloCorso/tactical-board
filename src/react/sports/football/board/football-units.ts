import type { Point, Size } from "../../../../core/board/types";
import type { DocumentMeasurement } from "../../../../core/board/types";
import { measurementToDocumentUnits } from "../../../../core/geometry/document-measurement";

export const FOOTBALL_UNITS_PER_METER = 8;
export const DEFAULT_FOOTBALL_PLAYER_SIZE = 30;
export const FOOTBALL_MEASUREMENT = {
  unit: "meter",
  unitsPerUnit: FOOTBALL_UNITS_PER_METER,
} as const satisfies DocumentMeasurement;

export function metersToPixels(value: number) {
  return measurementToDocumentUnits(value, FOOTBALL_MEASUREMENT);
}

export function pointMetersToPixels(point: Point): Point {
  return {
    x: metersToPixels(point.x),
    y: metersToPixels(point.y),
  };
}

export function sizeMetersToPixels(size: Size): Size {
  return {
    width: metersToPixels(size.width),
    height: metersToPixels(size.height),
  };
}
