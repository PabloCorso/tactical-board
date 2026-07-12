import { UploadSimpleIcon } from "@phosphor-icons/react";
import type { Asset, PlayerCaptionStyle } from "../../../core/board/types";
import {
  type BoardThemePlayerAppearanceDefinition,
  type PlayerAppearanceRendererRegistry,
} from "../theme/board-theme";
import { createPlayerObject } from "../../../core/objects/player-object";
import {
  createPlayerRenderer,
  renderPlayer,
} from "../../../core/tools/player-tool";
import { cn } from "../../ui/misc";
import { BoardToolIconCanvas } from "../toolbar/tool-icon-canvas";

export {
  PlayerAppearanceBaseColorField,
  PlayerAppearanceColorFields,
  PlayerAppearanceColorPicker,
  PlayerAppearanceRoleColorFields,
  type PlayerAppearanceColorPatch,
  type PlayerAppearanceColorValue,
} from "./player-appearance-color-fields";

export type PlayerAppearanceFieldValue = {
  color: string;
  colors?: Record<string, string>;
  fontSize?: number;
  labelColor?: string;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaptionStyle;
};

export function readUploadedAsset(
  file: File,
  onChange: (asset: Asset) => void,
) {
  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result === "string") {
      onChange({ src: reader.result });
    }
  };

  reader.readAsDataURL(file);
}

export function getPlayerAppearanceChangePatch(
  appearance: BoardThemePlayerAppearanceDefinition,
  patch: Partial<PlayerAppearanceFieldValue> = {},
): Partial<PlayerAppearanceFieldValue> {
  return {
    colors: undefined,
    options: undefined,
    asset: undefined,
    ...(appearance.defaultProps ?? {}),
    ...patch,
    appearanceId: appearance.id,
  };
}

export function PlayerAppearancePreview({
  appearanceRenderers,
  asset,
  appearance,
  className,
  color,
  colors,
  options,
}: {
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  asset?: Asset;
  appearance: BoardThemePlayerAppearanceDefinition;
  className?: string;
  color: string;
  colors?: Record<string, string>;
  options?: Record<string, unknown>;
}) {
  if (appearance.id === "image") {
    if (asset?.src) {
      return (
        <span
          className={cn(
            "border-tb-border-default bg-tb-background-screen h-9 w-9 overflow-hidden rounded-md border bg-cover bg-center",
            className,
          )}
          style={{ backgroundImage: `url("${asset.src}")` }}
        />
      );
    }

    return (
      <span
        className={cn(
          "border-tb-border-default bg-tb-background-screen flex h-9 w-9 items-center justify-center rounded-md border",
          className,
        )}
      >
        <UploadSimpleIcon className="text-tb-text-secondary size-4" />
      </span>
    );
  }

  const player = createPlayerObject({
    id: `player-appearance-preview-${appearance.id}`,
    position: { x: 0, y: 0 },
    size: { width: 2.4, height: 2.4 },
    color,
    colors,
    appearanceId: appearance.id,
    asset,
    options,
  });
  const renderer = appearanceRenderers
    ? createPlayerRenderer(appearanceRenderers)
    : renderPlayer;

  return (
    <BoardToolIconCanvas
      object={player}
      renderer={renderer}
      className={cn("h-9 w-9 shrink-0", className)}
      width={36}
      height={36}
    />
  );
}
