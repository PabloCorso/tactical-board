export const MIN_VIEWPORT_ZOOM = 0.5;
export const MAX_VIEWPORT_ZOOM = 4;

export function clampViewportZoom(zoom: number) {
  return Math.min(MAX_VIEWPORT_ZOOM, Math.max(MIN_VIEWPORT_ZOOM, zoom));
}
