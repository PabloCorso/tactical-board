import {
  AlignBottomSimpleIcon,
  AlignLeftSimpleIcon,
  AlignRightSimpleIcon,
  AlignTopSimpleIcon,
} from "@phosphor-icons/react";
import type {
  PlayerCaptionPlacement,
  PlayerCaptionStyle,
} from "../../../core/board/types";
import { DEFAULT_PLAYER_FONT_SIZE } from "../../../core/objects/player-object";
import { Button } from "../../ui/button";
import { cn } from "../../ui/misc";
import { NumberInput } from "../../ui/number-input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import type { useBoardEditorLabels } from "../editor/board-editor-labels";
import { PlayerAppearanceColorPicker } from "./player-appearance-color-fields";

export function PlayerCaptionFields({
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
  const captionSizeLabel = labels.playerAppearance.captionSize;

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
            {CAPTION_PLACEMENTS.map(({ icon: PlacementIcon, placement }) => {
              const placementLabel =
                labels.playerAppearance.captionPlacementValue[placement];
              const selected = (caption.placement ?? "bottom") === placement;

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
                      onClick={() => onChange({ ...caption, placement })}
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
            step={1}
            aria-label={captionDistanceLabel}
            className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-6 rounded-md p-1.5 py-0 text-sm md:text-sm"
            value={caption.distance ?? 4}
            onValueChange={(distance) => onChange({ ...caption, distance })}
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
            step={1}
            aria-label={captionSizeLabel}
            className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-6 rounded-md p-1.5 py-0 text-sm md:text-sm"
            value={caption.fontSize ?? DEFAULT_PLAYER_FONT_SIZE}
            onValueChange={(fontSize) => onChange({ ...caption, fontSize })}
          />
        </label>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-tb-text-secondary text-xs font-medium">
            {captionColorLabel}
          </span>
          <PlayerAppearanceColorPicker
            ariaLabel={captionColorLabel}
            value={caption.color ?? "#111827"}
            onChange={(color) => onChange({ ...caption, color })}
            chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
            className="h-6 w-full"
          />
        </div>
      </div>
    </>
  );
}

const CAPTION_PLACEMENTS = [
  { icon: AlignLeftSimpleIcon, placement: "left" },
  { icon: AlignTopSimpleIcon, placement: "top" },
  { icon: AlignRightSimpleIcon, placement: "right" },
  { icon: AlignBottomSimpleIcon, placement: "bottom" },
] satisfies Array<{
  icon: typeof AlignLeftSimpleIcon;
  placement: PlayerCaptionPlacement;
}>;
