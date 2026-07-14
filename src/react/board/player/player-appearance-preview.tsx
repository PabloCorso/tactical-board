import { UploadSimpleIcon } from "@phosphor-icons/react";
import type { Asset } from "../../../core/board/types";
import { createPlayerObject } from "../../../core/objects/player-object";
import {
  createPlayerRenderer,
  renderPlayer,
} from "../../../core/tools/player-tool";
import { cn } from "../../ui/misc";
import type {
  BoardThemePlayerAppearanceDefinition,
  PlayerAppearanceRendererRegistry,
} from "../theme/board-theme";
import { BoardToolIconCanvas } from "../toolbar/tool-icon-canvas";

export type PlayerAppearancePreviewProps = {
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  asset?: Asset;
  appearance: BoardThemePlayerAppearanceDefinition;
  className?: string;
  color: string;
  colors?: Record<string, string>;
  options?: Record<string, unknown>;
};

export function PlayerAppearancePreview({
  appearanceRenderers,
  asset,
  appearance,
  className,
  color,
  colors,
  options,
}: PlayerAppearancePreviewProps) {
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
