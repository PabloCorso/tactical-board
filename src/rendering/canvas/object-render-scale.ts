export function getAbsoluteCanvasExtent(extent: number) {
  return Math.abs(extent);
}

export function getWorldCanvasStrokeWidth(
  strokeWidth: number,
  pixelsPerUnit: number,
) {
  return Math.abs(strokeWidth * pixelsPerUnit);
}

export function getRelativeCanvasStrokeWidth(extent: number, ratio: number) {
  return getAbsoluteCanvasExtent(extent) * ratio;
}

export function getPlayerBorderWidth(radius: number) {
  return radius * 0.18;
}

export function getPlayerLabelFontSize(radius: number) {
  return radius * 0.95;
}

export function getArrowHeadLength(strokeWidth: number) {
  return strokeWidth * 4.5;
}
