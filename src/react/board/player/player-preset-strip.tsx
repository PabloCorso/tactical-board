import { UploadSimpleIcon } from "@phosphor-icons/react";
import type { Asset } from "../../../core/board/types";
import type {
  BoardTheme,
  PlayerAppearanceRendererRegistry,
} from "../theme/board-theme";
import {
  getThemePlayerAppearanceDefinitions,
  getThemePlayerPresetDefinitions,
} from "../theme/board-theme";
import { createPlayerObject } from "../../../core/objects/player-object";
import {
  createPlayerRenderer,
  renderPlayer,
} from "../../../core/tools/player-tool";
import { cn } from "../../ui/misc";
import { BoardToolIconCanvas } from "../toolbar/tool-icon-canvas";
import {
  readUploadedAsset,
  type PlayerAppearanceFieldValue,
} from "./player-appearance-fields";
import {
  getPlayerPresetAppearance,
  getPlayerPresetChangePatch,
  isPlayerPresetActive,
} from "./player-presets";

const IMAGE_APPEARANCE_ID = "image";

const presetButtonClassName = (active: boolean) =>
  cn(
    "border-tb-border-default bg-tb-background-screen hover:bg-tb-neutral-soft focus-visible:focus-ring transition-interactive flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-md border p-1 outline-hidden",
    active && "border-tb-accent ring-tb-accent/30 ring-2",
  );

export type PlayerPresetStripProps = {
  className?: string;
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  label: string;
  showLabel?: boolean;
  theme?: Pick<BoardTheme, "playerAppearances" | "playerPresets">;
  uploadImageLabel?: string;
  value: PlayerAppearanceFieldValue;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
};

/**
 * A grid of theme-provided kit presets rendered live in the current team
 * colors, plus an upload-your-own-image square when the theme offers the
 * image appearance. Selecting a preset applies its appearance, options, and
 * default colors while carrying over shared color roles.
 */
export function PlayerPresetStrip({
  className,
  appearanceRenderers,
  label,
  showLabel = true,
  theme,
  uploadImageLabel,
  value,
  onChange,
}: PlayerPresetStripProps) {
  const presets = getThemePlayerPresetDefinitions(theme);
  const imageAppearance = getThemePlayerAppearanceDefinitions(theme).find(
    (appearance) => appearance.id === IMAGE_APPEARANCE_ID,
  );

  if (presets.length === 0 && !imageAppearance) {
    return null;
  }

  const renderer = appearanceRenderers
    ? createPlayerRenderer(appearanceRenderers)
    : renderPlayer;
  const imageActive =
    (value.appearanceId ?? "") === IMAGE_APPEARANCE_ID && Boolean(value.asset);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {showLabel ? (
        <span className="text-tb-text-secondary text-xs font-medium">
          {label}
        </span>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-4 gap-1.5"
      >
        {presets.map((preset) => {
          const appearance = getPlayerPresetAppearance(theme, preset);
          const patch = getPlayerPresetChangePatch({
            current: value,
            preset,
            appearance,
          });
          const previewPlayer = createPlayerObject({
            id: `player-preset-preview-${preset.id}`,
            position: { x: 0, y: 0 },
            size: { width: 2.4, height: 2.4 },
            color: value.color,
            colors: patch.colors,
            appearanceId: patch.appearanceId,
            options: patch.options,
          });
          const active =
            !imageActive && isPlayerPresetActive(preset, value, appearance);

          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={preset.label}
              title={preset.label}
              className={presetButtonClassName(active)}
              onClick={() => onChange(patch)}
            >
              <BoardToolIconCanvas
                object={previewPlayer}
                renderer={renderer}
                className="h-8 w-8 shrink-0"
                width={32}
                height={32}
              />
            </button>
          );
        })}

        {imageAppearance ? (
          <label
            role="radio"
            aria-checked={imageActive}
            aria-label={uploadImageLabel ?? imageAppearance.label}
            title={uploadImageLabel ?? imageAppearance.label}
            tabIndex={0}
            className={presetButtonClassName(imageActive)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.currentTarget
                  .querySelector<HTMLInputElement>("input")
                  ?.click();
              }
            }}
          >
            {imageActive && value.asset?.src ? (
              <span
                className="h-8 w-8 shrink-0 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url("${value.asset.src}")` }}
              />
            ) : (
              <UploadSimpleIcon className="text-tb-text-secondary size-4 shrink-0" />
            )}
            <input
              type="file"
              accept="image/*,.svg"
              className="sr-only"
              tabIndex={-1}
              aria-label={uploadImageLabel ?? imageAppearance.label}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];

                if (file) {
                  readUploadedAsset(file, (asset: Asset) =>
                    onChange({
                      appearanceId: IMAGE_APPEARANCE_ID,
                      asset,
                      colors: undefined,
                      options: undefined,
                    }),
                  );
                }

                event.currentTarget.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
