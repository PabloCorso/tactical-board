import type {
  BoardFrameConfig,
  BoardObjectSize,
  ObjectType,
} from "../../../core/board/types";
import type { ToolRegistration } from "../../../core/tools/types";
import type { CanvasObjectRenderer } from "../../../core/rendering/canvas/types";
import type { CanvasObjectRendererRegistry } from "../../../core/rendering/canvas/types";

export type BoardThemeObjectDefinition = {
  type: ObjectType;
  kind: string;
  label: string;
  defaultSize?: BoardObjectSize;
  defaultProps?: Record<string, unknown>;
  capabilities?: object;
  transformCapabilities?: object;
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
