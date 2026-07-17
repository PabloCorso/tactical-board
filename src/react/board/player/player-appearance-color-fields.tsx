import { CaretDownIcon } from "@phosphor-icons/react";
import type { BoardThemePlayerAppearanceDefinition } from "../theme/board-theme";
import { Button, type ButtonProps } from "../../ui/button";
import { ColorPicker, ColorSwatch } from "../../ui/color-picker";
import { cn } from "../../ui/misc";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import type { useBoardEditorLabels } from "../editor/board-editor-labels";
import { getVisiblePlayerAppearanceColorRoles } from "./player-appearance-utils";

export type PlayerAppearanceColorValue = {
  color: string;
  colors?: Record<string, string>;
};

export type PlayerAppearanceColorPatch = Partial<PlayerAppearanceColorValue>;

export function PlayerAppearanceColorPicker({
  ariaLabel,
  chooseCustomColorLabel,
  className,
  mixed = false,
  value,
  onChange,
  ...props
}: Omit<ButtonProps, "aria-label" | "value" | "onChange"> & {
  ariaLabel: string;
  chooseCustomColorLabel: string;
  value: string;
  mixed?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger>
        <Button
          variant="outline"
          size="sm"
          aria-label={ariaLabel}
          className={cn("h-7 justify-between rounded-md px-2", className)}
          iconBefore={<ColorSwatch value={value} mixed={mixed} />}
          iconAfter={
            <CaretDownIcon className="text-tb-text-tertiary h-3.5 w-3.5" />
          }
          {...props}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-max gap-0.5 p-1">
        <ColorPicker
          value={value}
          mixed={mixed}
          onChange={onChange}
          chooseCustomColorLabel={chooseCustomColorLabel}
        />
      </PopoverContent>
    </Popover>
  );
}

function PlayerAppearanceColorField({
  chooseCustomColorLabel,
  label,
  value,
  onChange,
}: {
  chooseCustomColorLabel: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-7 items-center justify-between gap-3">
      <span className="text-tb-text-secondary text-xs font-medium">
        {label}
      </span>
      <PlayerAppearanceColorPicker
        ariaLabel={label}
        chooseCustomColorLabel={chooseCustomColorLabel}
        className="w-16"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export function PlayerAppearanceBaseColorField({
  labels,
  value,
  onChange,
}: {
  labels: ReturnType<typeof useBoardEditorLabels>;
  value: PlayerAppearanceColorValue;
  onChange: (patch: PlayerAppearanceColorPatch) => void;
}) {
  return (
    <PlayerAppearanceColorField
      chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
      label={labels.secondaryToolbar.playerColor}
      value={value.color}
      onChange={(color) => onChange({ color })}
    />
  );
}

export function PlayerAppearanceRoleColorFields({
  appearance,
  labels,
  options,
  value,
  onChange,
}: {
  appearance?: BoardThemePlayerAppearanceDefinition;
  labels: ReturnType<typeof useBoardEditorLabels>;
  options?: Record<string, unknown>;
  value: PlayerAppearanceColorValue;
  onChange: (patch: PlayerAppearanceColorPatch) => void;
}) {
  return getVisiblePlayerAppearanceColorRoles(appearance, options).map(
    (role) => {
      const roleColor =
        value.colors?.[role.id] ??
        (role.id === "shirt" ? value.color : role.defaultValue) ??
        value.color;

      return (
        <PlayerAppearanceColorField
          key={role.id}
          chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
          label={role.label}
          value={roleColor}
          onChange={(color) =>
            onChange({
              colors: {
                ...(value.colors ?? {}),
                [role.id]: color,
              },
            })
          }
        />
      );
    },
  );
}

export function PlayerAppearanceColorFields({
  appearance,
  labels,
  options,
  value,
  onChange,
  showBaseColor = true,
}: {
  appearance?: BoardThemePlayerAppearanceDefinition;
  labels: ReturnType<typeof useBoardEditorLabels>;
  options?: Record<string, unknown>;
  value: PlayerAppearanceColorValue;
  onChange: (patch: PlayerAppearanceColorPatch) => void;
  showBaseColor?: boolean;
}) {
  return (
    <>
      {showBaseColor ? (
        <PlayerAppearanceBaseColorField
          labels={labels}
          value={value}
          onChange={onChange}
        />
      ) : null}
      <PlayerAppearanceRoleColorFields
        appearance={appearance}
        labels={labels}
        options={options}
        value={value}
        onChange={onChange}
      />
    </>
  );
}
