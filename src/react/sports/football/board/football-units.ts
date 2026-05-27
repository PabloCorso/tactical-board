import type { Point, Size } from "../../../../core/board/types";

export const FOOTBALL_PIXELS_PER_METER = 8;

export function metersToPixels(value: number) {
  return value * FOOTBALL_PIXELS_PER_METER;
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
