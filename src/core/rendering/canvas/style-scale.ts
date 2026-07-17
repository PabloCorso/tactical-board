export function scaleCanvasStyleValue(value: number, zoom: number) {
  return value * zoom;
}

export function scaleCanvasDashStyle(dashStyle: number[], zoom: number) {
  return dashStyle.map((part) => scaleCanvasStyleValue(part, zoom));
}

export function scaleRoundCapCanvasDashStyle(
  dashStyle: number[],
  zoom: number,
  strokeWidth: number,
) {
  const scaledDashStyle = scaleCanvasDashStyle(dashStyle, zoom);
  const normalizedDashStyle =
    scaledDashStyle.length % 2 === 0
      ? scaledDashStyle
      : [...scaledDashStyle, ...scaledDashStyle];

  return normalizedDashStyle.map((part, index) =>
    index % 2 === 1 ? part + Math.abs(strokeWidth) : part,
  );
}
