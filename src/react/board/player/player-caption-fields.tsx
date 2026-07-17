import {
  AlignBottomSimpleIcon,
  AlignLeftSimpleIcon,
  AlignRightSimpleIcon,
  AlignTopSimpleIcon,
} from "@phosphor-icons/react";
import type {
  CaptionBackgroundStyle,
  CaptionPlacement,
  CaptionStyle,
  PlayerCaptionStyle,
} from "../../../core/board/types";
import { DEFAULT_PLAYER_FONT_SIZE } from "../../../core/objects/player-object";
import { getContrastingTextColor } from "../../../core/colors/contrast";
import { Button } from "../../ui/button";
import { cn } from "../../ui/misc";
import { NumberInput } from "../../ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import type { useBoardEditorLabels } from "../editor/board-editor-labels";
import { PlayerAppearanceColorPicker } from "./player-appearance-color-fields";

export type CaptionStyleFieldsMixedState = Partial<
  Record<keyof CaptionStyle, boolean>
>;

export type CaptionStyleFieldsProps = {
  fallbackBackgroundColor?: string;
  labels: ReturnType<typeof useBoardEditorLabels>;
  mixed?: CaptionStyleFieldsMixedState;
  onChange: (patch: Partial<CaptionStyle>) => void;
  placements?: CaptionPlacement[];
  style: CaptionStyle;
};

export function CaptionStyleFields({
  fallbackBackgroundColor = "#ffffff",
  labels,
  mixed = {},
  onChange,
  placements = CAPTION_PLACEMENTS.map((option) => option.placement),
  style,
}: CaptionStyleFieldsProps) {
  const captionPlacementLabel = labels.playerAppearance.captionPlacement;
  const captionColorLabel = labels.playerAppearance.captionColor;
  const captionDistanceLabel = labels.playerAppearance.captionDistance;
  const captionSizeLabel = labels.playerAppearance.captionSize;
  const backgroundStyle = style.backgroundStyle ?? "none";
  const backgroundColor = style.backgroundColor ?? fallbackBackgroundColor;
  const color =
    style.color ??
    (backgroundStyle === "solid"
      ? getContrastingTextColor(backgroundColor)
      : "#111827");
  const showBackgroundColor =
    backgroundStyle === "solid" || Boolean(mixed.backgroundStyle);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-tb-text-secondary text-xs font-medium">
            {captionPlacementLabel}
          </span>
          <div
            role="radiogroup"
            aria-label={captionPlacementLabel}
            className="flex justify-between gap-0.5"
          >
            {CAPTION_PLACEMENTS.filter(({ placement }) =>
              placements.includes(placement),
            ).map(({ icon: PlacementIcon, placement }) => {
              const placementLabel =
                labels.playerAppearance.captionPlacementValue[placement];
              const selected =
                !mixed.placement && (style.placement ?? "bottom") === placement;

              return (
                <Tooltip key={placement}>
                  <TooltipTrigger>
                    <Button
                      variant="outline"
                      size="sm"
                      role="radio"
                      aria-checked={selected}
                      aria-label={placementLabel}
                      iconBefore={<PlacementIcon />}
                      iconSize="sm"
                      className={cn(
                        "h-6 w-6 rounded-md",
                        selected && "border-tb-accent ring-tb-accent/30 ring-2",
                      )}
                      onClick={() => onChange({ placement })}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{placementLabel}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <label className="inline-flex min-w-0 flex-col gap-0.5">
          <span className="text-tb-text-secondary text-xs font-medium">
            {captionDistanceLabel}
          </span>
          <NumberInput
            min={0}
            mixed={mixed.distance}
            placeholder={labels.selectionToolbar.mixedValue}
            step={1}
            aria-label={captionDistanceLabel}
            className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-6 rounded-md p-1.5 py-0 text-sm md:text-sm"
            value={style.distance ?? 4}
            onValueChange={(distance) => onChange({ distance })}
          />
        </label>
      </div>

      <div className="flex gap-1.5">
        <label className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-tb-text-secondary text-xs font-medium">
            {captionSizeLabel}
          </span>
          <NumberInput
            min={1}
            mixed={mixed.fontSize}
            placeholder={labels.selectionToolbar.mixedValue}
            step={1}
            aria-label={captionSizeLabel}
            className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-6 rounded-md p-1.5 py-0 text-sm md:text-sm"
            value={style.fontSize ?? DEFAULT_PLAYER_FONT_SIZE}
            onValueChange={(fontSize) => onChange({ fontSize })}
          />
        </label>

        <CaptionColorField
          label={captionColorLabel}
          mixed={mixed.color}
          value={color}
          onChange={(color) => onChange({ color })}
          labels={labels}
        />
      </div>

      <div className="flex gap-1.5">
        <label className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-tb-text-secondary text-xs font-medium">
            {labels.playerAppearance.captionBackground}
          </span>
          <Select
            value={mixed.backgroundStyle ? "" : backgroundStyle}
            onValueChange={(value) =>
              onChange({ backgroundStyle: value as CaptionBackgroundStyle })
            }
          >
            <SelectTrigger
              aria-label={labels.playerAppearance.captionBackground}
              className="h-6 rounded-md px-2 text-xs"
              placeholder={labels.selectionToolbar.mixedValue}
            >
              {() =>
                mixed.backgroundStyle
                  ? labels.selectionToolbar.mixedValue
                  : labels.playerAppearance.captionBackgroundValue[
                      backgroundStyle
                    ]
              }
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_STYLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {labels.playerAppearance.captionBackgroundValue[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {showBackgroundColor ? (
          <CaptionColorField
            displayLabel={labels.playerAppearance.captionColor}
            label={labels.playerAppearance.captionBackgroundColor}
            mixed={mixed.backgroundColor}
            value={backgroundColor}
            onChange={(backgroundColor) => onChange({ backgroundColor })}
            labels={labels}
          />
        ) : null}
      </div>
    </>
  );
}

export function PlayerCaptionFields({
  caption,
  fallbackBackgroundColor,
  labels,
  onChange,
}: {
  caption: PlayerCaptionStyle;
  fallbackBackgroundColor?: string;
  labels: ReturnType<typeof useBoardEditorLabels>;
  onChange: (caption: PlayerCaptionStyle) => void;
}) {
  return (
    <CaptionStyleFields
      fallbackBackgroundColor={fallbackBackgroundColor}
      labels={labels}
      style={caption}
      onChange={(patch) => onChange({ ...caption, ...patch })}
    />
  );
}

function CaptionColorField({
  disabled = false,
  displayLabel,
  label,
  labels,
  mixed = false,
  value,
  onChange,
}: {
  disabled?: boolean;
  displayLabel?: string;
  label: string;
  labels: ReturnType<typeof useBoardEditorLabels>;
  mixed?: boolean;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-tb-text-secondary text-xs font-medium">
        {displayLabel ?? label}
      </span>
      <PlayerAppearanceColorPicker
        ariaLabel={label}
        chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
        className="h-6 w-full"
        disabled={disabled}
        mixed={mixed}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

const CAPTION_PLACEMENTS = [
  { icon: AlignLeftSimpleIcon, placement: "left" },
  { icon: AlignTopSimpleIcon, placement: "top" },
  { icon: AlignRightSimpleIcon, placement: "right" },
  { icon: AlignBottomSimpleIcon, placement: "bottom" },
] satisfies Array<{
  icon: typeof AlignLeftSimpleIcon;
  placement: CaptionPlacement;
}>;

const BACKGROUND_STYLES = ["none", "solid"] as const;
