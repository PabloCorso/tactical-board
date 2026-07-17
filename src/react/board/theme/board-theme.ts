import type {
  Asset,
  BoardFrameConfig,
  BoardObjectSize,
  ObjectType,
} from "../../../core/board/types";
import type { PlayerObjectProps } from "../../../core/objects/player-object";
import {
  DEFAULT_PLAYER_APPEARANCE_ID,
  type PlayerAppearanceRendererRegistry,
} from "../../../core/tools/player-appearance";
import type { ToolRegistration } from "../../../core/tools/types";
import type { CanvasObjectRenderer } from "../../../core/rendering/canvas/types";
import type { CanvasObjectRendererRegistry } from "../../../core/rendering/canvas/types";

export type {
  PlayerAppearanceRenderer,
  PlayerAppearanceRendererInput,
  PlayerAppearanceRendererRegistry,
} from "../../../core/tools/player-appearance";

export type BoardThemePlayerAppearanceDefinition = {
  id: string;
  label: string;
  colors?: Array<{
    id: string;
    label: string;
    defaultValue?: string;
    visibleWhen?: {
      optionId: string;
      values: string[];
    };
  }>;
  options?: Array<{
    id: string;
    label: string;
    defaultValue?: unknown;
    choices?: Array<{
      value: string;
      label: string;
    }>;
  }>;
  defaultProps?: Partial<
    Pick<
      PlayerObjectProps,
      "color" | "colors" | "fontSize" | "asset" | "options"
    >
  >;
};

export const DEFAULT_BOARD_PLAYER_APPEARANCES: BoardThemePlayerAppearanceDefinition[] =
  [
    {
      id: DEFAULT_PLAYER_APPEARANCE_ID,
      label: "Circle",
    },
    {
      id: "image",
      label: "Image",
    },
  ];

/**
 * A theme-provided kit shortcut: selecting it applies an appearance plus
 * default options and role colors, while colors for roles the target
 * appearance shares with the current style are carried over so team colors
 * survive preset switches.
 */
export type BoardThemePlayerPresetDefinition = {
  id: string;
  label: string;
  appearanceId: string;
  colors?: Record<string, string>;
  options?: Record<string, unknown>;
};

export type BoardThemeObjectDefinition = {
  type: ObjectType;
  kind: string;
  label: string;
  defaultSize?: BoardObjectSize;
  asset?: Asset;
  defaultProps?: Record<string, unknown>;
  lockedAspectRatio?: boolean;
  selectionBounds?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  selectionPaddingPx?: number;
  minimumHitRadiusPx?: number;
  hitTestShape?: "rect" | "circle";
};

export type BoardTheme = {
  id: string;
  name: string;
  frames?: BoardFrameConfig[];
  objects?: BoardThemeObjectDefinition[];
  playerAppearances?: BoardThemePlayerAppearanceDefinition[];
  playerPresets?: BoardThemePlayerPresetDefinition[];
};

export type BoardThemeObjectAdapterInput = {
  theme?: Pick<BoardTheme, "objects">;
  definitions: BoardThemeObjectDefinition[];
};

export type BoardThemeObjectAdapter = {
  type: ObjectType;
  createRenderer?: (
    input: BoardThemeObjectAdapterInput,
  ) => CanvasObjectRenderer | undefined;
  createTools?: (input: BoardThemeObjectAdapterInput) => ToolRegistration[];
};

export type BoardThemeAdapters = {
  objectAdapters?: BoardThemeObjectAdapter[];
  objectRenderers?: CanvasObjectRendererRegistry;
  playerAppearanceRenderers?: PlayerAppearanceRendererRegistry;
};

export type ResolvedBoardTheme = BoardTheme & {
  adapters?: BoardThemeAdapters;
  objectRenderers: CanvasObjectRendererRegistry;
};

export function getThemeObjectDefinitions(
  theme?: Pick<BoardTheme, "objects">,
  type?: ObjectType,
) {
  const definitions = theme?.objects ?? [];

  return type
    ? definitions.filter((definition) => definition.type === type)
    : definitions;
}

export function getThemePlayerAppearanceDefinitions(
  theme?: Pick<BoardTheme, "playerAppearances">,
) {
  return theme?.playerAppearances && theme.playerAppearances.length > 0
    ? theme.playerAppearances
    : DEFAULT_BOARD_PLAYER_APPEARANCES;
}

export function getThemePlayerPresetDefinitions(
  theme?: Pick<BoardTheme, "playerPresets">,
) {
  return theme?.playerPresets ?? [];
}

export function createThemeObjectRenderer({
  adapters,
  theme,
  type,
}: {
  adapters?: BoardThemeAdapters;
  theme?: Pick<BoardTheme, "objects">;
  type: ObjectType;
}): CanvasObjectRenderer | undefined {
  const adapter = adapters?.objectAdapters?.find((item) => item.type === type);

  return adapter?.createRenderer?.({
    definitions: getThemeObjectDefinitions(theme, type),
    theme,
  });
}
