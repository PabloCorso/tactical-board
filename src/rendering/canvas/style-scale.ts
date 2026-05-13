export function scaleCanvasStyleValue(value: number, zoom: number) {
  return value * zoom;
}

export function scaleCanvasDashStyle(dashStyle: number[], zoom: number) {
  return dashStyle.map((part) => scaleCanvasStyleValue(part, zoom));
}
