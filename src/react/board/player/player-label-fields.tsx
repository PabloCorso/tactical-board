import { DEFAULT_PLAYER_FONT_SIZE } from "../../../core/objects/player-object";
import { NumberInput } from "../../ui/number-input";
import type { useBoardEditorLabels } from "../editor/board-editor-labels";
import { PlayerAppearanceColorPicker } from "./player-appearance-color-fields";

export type PlayerLabelFieldValue = {
  color: string;
  fontSize: number;
};

export function PlayerLabelFields({
  labels,
  value,
  onChange,
}: {
  labels: ReturnType<typeof useBoardEditorLabels>;
  value: PlayerLabelFieldValue;
  onChange: (patch: Partial<PlayerLabelFieldValue>) => void;
}) {
  return (
    <div className="flex gap-1.5">
      <label className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-tb-text-secondary text-xs font-medium">
          {labels.playerAppearance.labelSize}
        </span>
        <NumberInput
          min={1}
          step={1}
          aria-label={labels.playerAppearance.labelSize}
          className="border-tb-border-default bg-tb-background-screen text-tb-text-primary h-6 rounded-md p-1.5 py-0 text-sm md:text-sm"
          value={value.fontSize ?? DEFAULT_PLAYER_FONT_SIZE}
          onValueChange={(fontSize) => onChange({ fontSize })}
        />
      </label>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-tb-text-secondary text-xs font-medium">
          {labels.playerAppearance.labelColor}
        </span>
        <PlayerAppearanceColorPicker
          ariaLabel={labels.playerAppearance.labelColor}
          value={value.color}
          onChange={(color) => onChange({ color })}
          chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
          className="h-6 w-full"
        />
      </div>
    </div>
  );
}
