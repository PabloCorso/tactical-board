import type { CanvasObjectRendererRegistry } from "../../../../core/rendering/canvas/types";
import { resolvedBasketballTheme } from "../theme/basketball-theme";

export function getBasketballObjectRenderers(
  objectRenderers?: CanvasObjectRendererRegistry,
): CanvasObjectRendererRegistry {
  return {
    ...resolvedBasketballTheme.objectRenderers,
    ...objectRenderers,
  };
}
