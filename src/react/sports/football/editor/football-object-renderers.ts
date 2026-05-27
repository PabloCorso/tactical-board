import type { CanvasObjectRendererRegistry } from "../../../../core/rendering/canvas/types";
import { resolvedFootballTheme } from "../theme/football-theme";

export function getFootballObjectRenderers(
  objectRenderers?: CanvasObjectRendererRegistry,
): CanvasObjectRendererRegistry {
  return {
    ...resolvedFootballTheme.objectRenderers,
    ...objectRenderers,
  };
}
