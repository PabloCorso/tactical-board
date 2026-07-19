import { arrowObjectDefinition } from "../../../core/tools/arrow-tool";
import {
  createPlayerObjectDefinition,
  createPlayerRenderer,
} from "../../../core/tools/player-tool";
import { shapeObjectDefinition } from "../../../core/tools/shape-tool";
import { textObjectDefinition } from "../../../core/tools/text-tool";
import type { BoardTheme, BoardThemeAdapters } from "./board-theme";
import {
  createThemeObjectDefinition,
  getThemeObjectDefinitions,
} from "./board-theme";

export function createBoardObjectDefinitions(
  options: {
    theme?: BoardTheme;
    adapters?: BoardThemeAdapters;
  } = {},
) {
  const themeObjectDefinitions = (
    options.adapters?.objectAdapters ?? []
  ).flatMap((adapter) => {
    const definitions = getThemeObjectDefinitions(options.theme, adapter.type);
    const definition = createThemeObjectDefinition({
      adapters: options.adapters,
      theme: options.theme,
      type: adapter.type,
    });

    return definition && definitions.length > 0 ? [definition] : [];
  });

  return [
    createPlayerObjectDefinition(
      createPlayerRenderer(options.adapters?.playerAppearanceRenderers),
    ),
    textObjectDefinition,
    arrowObjectDefinition,
    shapeObjectDefinition,
    ...themeObjectDefinitions,
  ];
}
