export function getAbsoluteCanvasExtent(extent: number) {
  return Math.abs(extent);
}

export function getScaledCanvasStrokeWidth(strokeWidth: number, scale: number) {
  return Math.abs(strokeWidth * scale);
}

export function getRelativeCanvasStrokeWidth(extent: number, ratio: number) {
  return getAbsoluteCanvasExtent(extent) * ratio;
}

export function getPlayerBorderWidth(radius: number) {
  return radius * 0.18;
}

export function getContainedPlayerCircleGeometry(outerRadius: number) {
  const borderWidth = getPlayerBorderWidth(outerRadius);

  return {
    borderWidth,
    radius: Math.max(0, outerRadius - borderWidth / 2),
  };
}

export function getPlayerLabelFontSize(radius: number) {
  return radius * 0.95;
}

export function getArrowHeadLength(strokeWidth: number) {
  return strokeWidth * 4.5;
}
