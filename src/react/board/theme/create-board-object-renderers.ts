import { ARROW_OBJECT_TYPE } from "../../../core/objects/arrow-object";
import { PLAYER_OBJECT_TYPE } from "../../../core/objects/player-object";
import { SHAPE_OBJECT_TYPE } from "../../../core/objects/shape-object";
import { TEXT_OBJECT_TYPE } from "../../../core/objects/text-object";
import type { CanvasObjectRendererRegistry } from "../../../core/rendering/canvas/types";
import { renderArrow } from "../../../core/tools/arrow-tool";
import { renderPlayer } from "../../../core/tools/player-tool";
import { renderShape } from "../../../core/tools/shape-tool";
import { renderText } from "../../../core/tools/text-tool";
import type { BoardTheme, BoardThemeAdapters } from "./board-theme";
import {
  createThemeObjectRenderer,
  getThemeObjectDefinitions,
} from "./board-theme";

export function createBoardObjectRenderers(
  options: {
    theme?: BoardTheme;
    adapters?: BoardThemeAdapters;
  } = {},
): CanvasObjectRendererRegistry {
  const themeObjectRenderers = Object.fromEntries(
    (options.adapters?.objectAdapters ?? []).flatMap((adapter) => {
      const definitions = getThemeObjectDefinitions(options.theme, adapter.type);
      const renderer = createThemeObjectRenderer({
        adapters: options.adapters,
        theme: options.theme,
        type: adapter.type,
      });

      return renderer && definitions.length > 0
        ? [[adapter.type, renderer]]
        : [];
    }),
  );

  return {
    [PLAYER_OBJECT_TYPE]: renderPlayer,
    [TEXT_OBJECT_TYPE]: renderText,
    [ARROW_OBJECT_TYPE]: renderArrow,
    [SHAPE_OBJECT_TYPE]: renderShape,
    ...themeObjectRenderers,
    ...options.adapters?.objectRenderers,
  };
}
