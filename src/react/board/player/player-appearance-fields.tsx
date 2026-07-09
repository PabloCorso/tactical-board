import { UploadSimpleIcon } from "@phosphor-icons/react";
import type {
  Asset,
  PlayerCaptionPlacement,
  PlayerCaptionStyle,
} from "../../../core/board/types";
import {
  type BoardTheme,
  type BoardThemePlayerAppearanceDefinition,
  type PlayerAppearanceRendererRegistry,
  getThemePlayerAppearanceDefinitions,
} from "../theme/board-theme";
import { createPlayerObject } from "../../../core/objects/player-object";
import {
  createPlayerRenderer,
  renderPlayer,
} from "../../../core/tools/player-tool";
import { ColorPicker } from "../../ui/color-picker";
import { Input } from "../../ui/input";
import { cn } from "../../ui/misc";
import { Switch } from "../../ui/switch";
import type { useBoardEditorLabels } from "../editor/board-editor-labels";
import { BoardToolIconCanvas } from "../toolbar/tool-icon-canvas";

export type PlayerAppearanceFieldValue = {
  color: string;
  colors?: Record<string, string>;
  fontSize?: number;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaptionStyle;
};

type PlayerAppearanceFieldsProps = {
  className?: string;
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  labels: ReturnType<typeof useBoardEditorLabels>;
  theme?: Pick<BoardTheme, "playerAppearances">;
  value: PlayerAppearanceFieldValue;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
};

const CAPTION_PLACEMENTS: PlayerCaptionPlacement[] = [
  "top",
  "right",
  "bottom",
  "left",
];

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

function getCaptionStyle(
  value: PlayerAppearanceFieldValue,
): PlayerCaptionStyle {
  return value.caption ?? {};
}

function getSelectedAppearance(
  theme: PlayerAppearanceFieldsProps["theme"],
  appearanceId: string | undefined,
) {
  const appearances = getThemePlayerAppearanceDefinitions(theme);

  return (
    appearances.find((appearance) => appearance.id === appearanceId) ??
    appearances[0]
  );
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
  color,
  colors,
  options,
}: {
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  asset?: Asset;
  appearance: BoardThemePlayerAppearanceDefinition;
  color: string;
  colors?: Record<string, string>;
  options?: Record<string, unknown>;
}) {
  if (appearance.id === "image") {
    if (asset?.src) {
      return (
        <span
          className="border-tb-border-default bg-tb-background-screen h-9 w-9 overflow-hidden rounded-md border bg-cover bg-center"
          style={{ backgroundImage: `url("${asset.src}")` }}
        />
      );
    }

    return (
      <span className="border-tb-border-default bg-tb-background-screen flex h-9 w-9 items-center justify-center rounded-md border">
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
      className="h-9 w-9 shrink-0"
      width={36}
      height={36}
    />
  );
}

export function PlayerAppearanceColorFields({
  appearance,
  labels,
  value,
  onChange,
  showBaseColor = true,
}: {
  appearance?: BoardThemePlayerAppearanceDefinition;
  labels: ReturnType<typeof useBoardEditorLabels>;
  value: Pick<PlayerAppearanceFieldValue, "color" | "colors">;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
  showBaseColor?: boolean;
}) {
  return (
    <>
      {showBaseColor ? (
        <div className="flex h-7 items-center justify-between gap-3">
          <span className="text-tb-text-secondary text-xs font-medium">
            {labels.secondaryToolbar.playerColor}
          </span>
          <ColorPicker
            value={value.color}
            onChange={(color) => onChange({ color })}
            label={value.color}
            variant="compact"
            className="h-7 w-24 rounded-md px-1.5"
            chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
          />
        </div>
      ) : null}

      {appearance?.colors?.map((role) => {
        const roleColor =
          value.colors?.[role.id] ??
          (role.id === "shirt" ? value.color : role.defaultValue) ??
          value.color;

        return (
          <div
            key={role.id}
            className="flex h-7 items-center justify-between gap-3"
          >
            <span className="text-tb-text-secondary text-xs font-medium">
              {role.label}
            </span>
            <ColorPicker
              value={roleColor}
              onChange={(color) =>
                onChange({
                  colors: {
                    ...(value.colors ?? {}),
                    [role.id]: color,
                  },
                })
              }
              label={roleColor}
              variant="compact"
              className="h-7 w-24 rounded-md px-1.5"
              chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
            />
          </div>
        );
      })}
    </>
  );
}

export function PlayerAppearanceOptionFields({
  appearance,
  value,
  onChange,
}: {
  appearance?: BoardThemePlayerAppearanceDefinition;
  value: Pick<PlayerAppearanceFieldValue, "options">;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
}) {
  return (
    <>
      {appearance?.options?.map((option) => {
        const optionValue =
          value.options?.[option.id] ?? option.defaultValue ?? "";

        if (option.choices && option.choices.length > 0) {
          return (
            <label key={option.id} className="flex flex-col gap-0.5">
              <span className="text-tb-text-secondary text-xs font-medium">
                {option.label}
              </span>
              <select
                aria-label={option.label}
                className="border-tb-border-default bg-tb-background-screen text-tb-text-primary focus-visible:focus-ring h-7 rounded-md border px-2 text-sm outline-hidden"
                value={String(optionValue)}
                onChange={(event) =>
                  onChange({
                    options: {
                      ...(value.options ?? {}),
                      [option.id]: event.currentTarget.value,
                    },
                  })
                }
              >
                {option.choices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (typeof option.defaultValue === "boolean") {
          return (
            <div
              key={option.id}
              className="flex h-7 items-center justify-between gap-3"
            >
              <span className="text-tb-text-secondary text-xs font-medium">
                {option.label}
              </span>
              <Switch
                checked={Boolean(optionValue)}
                aria-label={option.label}
                onCheckedChange={(checked) =>
                  onChange({
                    options: {
                      ...(value.options ?? {}),
                      [option.id]: checked,
                    },
                  })
                }
              />
            </div>
          );
        }

        return (
          <label key={option.id} className="flex flex-col gap-0.5">
            <span className="text-tb-text-secondary text-xs font-medium">
              {option.label}
            </span>
            <Input
              type={typeof option.defaultValue === "number" ? "number" : "text"}
              aria-label={option.label}
              className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-7 rounded-md px-2 text-sm md:text-sm"
              value={String(optionValue)}
              onChange={(event) =>
                onChange({
                  options: {
                    ...(value.options ?? {}),
                    [option.id]:
                      typeof option.defaultValue === "number"
                        ? Number(event.currentTarget.value)
                        : event.currentTarget.value,
                  },
                })
              }
            />
          </label>
        );
      })}
    </>
  );
}

export function PlayerCaptionStyleFields({
  caption,
  labels,
  onChange,
}: {
  caption: PlayerCaptionStyle;
  labels: ReturnType<typeof useBoardEditorLabels>;
  onChange: (caption: PlayerCaptionStyle) => void;
}) {
  const captionPlacementLabel = labels.playerAppearance.captionPlacement;
  const captionColorLabel = labels.playerAppearance.captionColor;
  const captionDistanceLabel = labels.playerAppearance.captionDistance;

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5">
        <label className="flex flex-col gap-0.5">
          <span className="text-tb-text-secondary text-xs font-medium">
            {captionPlacementLabel}
          </span>
          <select
            aria-label={captionPlacementLabel}
            className="border-tb-border-default bg-tb-background-screen text-tb-text-primary focus-visible:focus-ring h-7 rounded-md border px-2 text-sm outline-hidden"
            value={caption.placement ?? "bottom"}
            onChange={(event) =>
              onChange({
                ...caption,
                placement: event.currentTarget.value as PlayerCaptionPlacement,
              })
            }
          >
            {CAPTION_PLACEMENTS.map((placement) => (
              <option key={placement} value={placement}>
                {labels.playerAppearance.captionPlacementValue[placement]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-0.5">
          <span className="text-tb-text-secondary text-xs font-medium">
            {captionDistanceLabel}
          </span>
          <Input
            type="number"
            min={0}
            step={0.25}
            aria-label={captionDistanceLabel}
            className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-7 rounded-md px-2 text-sm md:text-sm"
            value={caption.distance ?? 4}
            onChange={(event) =>
              onChange({
                ...caption,
                distance: Number(event.currentTarget.value),
              })
            }
          />
        </label>
      </div>

      <div className="flex h-7 items-center justify-between gap-3">
        <span className="text-tb-text-secondary text-xs font-medium">
          {captionColorLabel}
        </span>
        <ColorPicker
          value={caption.color ?? "#111827"}
          onChange={(color) =>
            onChange({
              ...caption,
              color,
            })
          }
          label={caption.color ?? "#111827"}
          variant="compact"
          className="h-7 w-24 rounded-md px-1.5"
          chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
        />
      </div>
    </>
  );
}

export function PlayerAppearanceFields({
  appearanceRenderers,
  className,
  labels,
  theme,
  value,
  onChange,
}: PlayerAppearanceFieldsProps) {
  const appearances = getThemePlayerAppearanceDefinitions(theme);
  const selectedAppearance = getSelectedAppearance(theme, value.appearanceId);
  const caption = getCaptionStyle(value);
  const appearanceLabel = labels.playerAppearance.appearance;
  const visualLabel = labels.playerAppearance.visual;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-col gap-1">
        <span className="text-tb-text-secondary text-xs font-medium">
          {appearanceLabel}
        </span>
        <div
          role="radiogroup"
          aria-label={appearanceLabel}
          className="grid grid-cols-3 gap-1.5"
        >
          {appearances.map((appearance) => {
            const selected = selectedAppearance?.id === appearance.id;

            if (appearance.id === "image") {
              return (
                <label
                  key={appearance.id}
                  role="radio"
                  aria-checked={selected}
                  aria-label={appearance.label}
                  title={appearance.label}
                  tabIndex={0}
                  className={cn(
                    "border-tb-border-default bg-tb-background-screen hover:bg-tb-neutral-soft focus-visible:focus-ring transition-interactive flex h-14 min-w-0 cursor-pointer items-center justify-center rounded-md border p-1 outline-hidden",
                    selected && "border-tb-accent ring-tb-accent/30 ring-2",
                  )}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.currentTarget
                        .querySelector<HTMLInputElement>("input")
                        ?.click();
                    }
                  }}
                >
                  <PlayerAppearancePreview
                    appearanceRenderers={appearanceRenderers}
                    asset={value.asset}
                    appearance={appearance}
                    color={value.color}
                    colors={value.colors}
                    options={value.options}
                  />
                  <input
                    type="file"
                    accept="image/*,.svg"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label={
                      value.asset
                        ? labels.playerAppearance.replaceVisual
                        : visualLabel
                    }
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];

                      if (file) {
                        readUploadedAsset(file, (asset) =>
                          onChange(
                            getPlayerAppearanceChangePatch(appearance, {
                              asset,
                            }),
                          ),
                        );
                      }

                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              );
            }

            return (
              <button
                key={appearance.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={appearance.label}
                title={appearance.label}
                className={cn(
                  "border-tb-border-default bg-tb-background-screen hover:bg-tb-neutral-soft focus-visible:focus-ring transition-interactive flex h-14 min-w-0 items-center justify-center rounded-md border p-1 outline-hidden",
                  selected && "border-tb-accent ring-tb-accent/30 ring-2",
                )}
                onClick={() =>
                  onChange(getPlayerAppearanceChangePatch(appearance))
                }
              >
                <PlayerAppearancePreview
                  appearanceRenderers={appearanceRenderers}
                  asset={value.asset}
                  appearance={appearance}
                  color={value.color}
                  colors={value.colors}
                  options={value.options}
                />
              </button>
            );
          })}
        </div>
      </div>

      <PlayerAppearanceColorFields
        appearance={selectedAppearance}
        labels={labels}
        value={value}
        onChange={onChange}
      />

      <PlayerAppearanceOptionFields
        appearance={selectedAppearance}
        value={value}
        onChange={onChange}
      />

      <PlayerCaptionStyleFields
        caption={caption}
        labels={labels}
        onChange={(nextCaption) => onChange({ caption: nextCaption })}
      />
    </div>
  );
}
