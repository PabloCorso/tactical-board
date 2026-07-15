import {
  ArrowCounterClockwiseIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";
import type { Asset } from "../../../core/board/types";
import {
  type BoardThemePlayerAppearanceDefinition,
  type PlayerAppearanceRendererRegistry,
} from "../theme/board-theme";
import { getThemePlayerAppearanceDefinitions } from "../theme/board-theme";
import { DEFAULT_PLAYER_SIZE } from "../../../core/objects/player-object";
import { DEFAULT_PLAYER_APPEARANCE_ID } from "../../../core/tools/player-appearance";
import { cn } from "../../ui/misc";
import { Button } from "../../ui/button";
import { Slider } from "../../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../ui/select";
import type { useBoardEditorLabels } from "../editor/board-editor-labels";
import { PlayerAppearanceColorFields } from "./player-appearance-color-fields";
import { PlayerAppearancePreview } from "./player-appearance-preview";
import {
  getPlayerAppearanceFieldChangePatch,
  type PlayerAppearanceFieldValue,
} from "./player-appearance-utils";

const MIN_PLAYER_SIZE = 12;
const MAX_PLAYER_SIZE = 80;

export type PlayerAppearanceFieldsProps = Omit<
  ComponentProps<"div">,
  "onChange"
> & {
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  appearances?: BoardThemePlayerAppearanceDefinition[];
  labels: ReturnType<typeof useBoardEditorLabels>;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
  value: PlayerAppearanceFieldValue;
};

export function PlayerAppearanceFields({
  appearanceRenderers,
  appearances: appearanceDefinitions,
  className,
  labels,
  onChange,
  value,
  ...props
}: PlayerAppearanceFieldsProps) {
  const appearances = getThemePlayerAppearanceDefinitions({
    playerAppearances: appearanceDefinitions,
  });
  const appearanceId = value.appearanceId ?? DEFAULT_PLAYER_APPEARANCE_ID;
  const appearance = appearances.find(
    (candidate) => candidate.id === appearanceId,
  );
  const size = value.size ?? DEFAULT_PLAYER_SIZE;

  return (
    <div
      {...props}
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <div
        role="radiogroup"
        aria-label={labels.playerAppearance.appearance}
        className="grid grid-cols-3 gap-1.5"
      >
        {appearances.map((candidate) =>
          candidate.id === "image" ? (
            <PlayerImageAppearanceButton
              key={candidate.id}
              active={appearanceId === candidate.id}
              asset={value.asset}
              label={candidate.label}
              onChange={(asset) =>
                onChange({
                  ...getPlayerAppearanceFieldChangePatch(candidate, value),
                  asset,
                })
              }
            />
          ) : (
            <button
              key={candidate.id}
              type="button"
              role="radio"
              aria-checked={appearanceId === candidate.id}
              aria-label={candidate.label}
              title={candidate.label}
              className={appearanceButtonClassName(
                appearanceId === candidate.id,
              )}
              onClick={() =>
                onChange(getPlayerAppearanceFieldChangePatch(candidate, value))
              }
            >
              <PlayerAppearancePreview
                appearanceRenderers={appearanceRenderers}
                appearance={candidate}
                color={value.color}
                colors={value.colors}
                options={value.options}
              />
            </button>
          ),
        )}
      </div>

      {appearanceId !== "image" ? (
        <>
          <PlayerAppearanceOptionFields
            appearance={appearance}
            options={value.options}
            onChange={(options) => onChange({ options })}
          />
          <div className="flex flex-col gap-1.5">
            <PlayerAppearanceColorFields
              appearance={appearance}
              labels={labels}
              options={value.options}
              value={{ color: value.color, colors: value.colors }}
              onChange={onChange}
            />
          </div>
        </>
      ) : value.asset ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-tb-text-secondary h-7 justify-start px-2 text-xs"
          iconBefore={<ArrowCounterClockwiseIcon />}
          iconSize="sm"
          onClick={() => onChange({ asset: undefined })}
        >
          {labels.selectionToolbar.playerPhotoRemove}
        </Button>
      ) : null}

      <div className="flex flex-col gap-0.5">
        <PlayerAppearanceFieldLabel>
          {labels.teamPanel.playerSize}
        </PlayerAppearanceFieldLabel>
        <Slider
          aria-label={labels.teamPanel.playerSize}
          thumbAriaLabel={labels.teamPanel.playerSize}
          controlClassName="h-6"
          min={MIN_PLAYER_SIZE}
          max={MAX_PLAYER_SIZE}
          step={1}
          largeStep={10}
          value={Math.min(MAX_PLAYER_SIZE, Math.max(MIN_PLAYER_SIZE, size))}
          onValueChange={(nextSize) => onChange({ size: nextSize })}
        />
      </div>
    </div>
  );
}

function PlayerAppearanceOptionFields({
  appearance,
  options,
  onChange,
}: {
  appearance?: BoardThemePlayerAppearanceDefinition;
  options?: Record<string, unknown>;
  onChange: (options: Record<string, unknown>) => void;
}) {
  const configurableOptions =
    appearance?.options?.filter((option) => option.choices?.length) ?? [];

  if (configurableOptions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {configurableOptions.map((option) => {
        const selectedValue =
          options?.[option.id] ??
          option.defaultValue ??
          option.choices?.[0]?.value;

        return (
          <label
            key={option.id}
            className="flex items-center justify-between gap-3"
          >
            <PlayerAppearanceFieldLabel>
              {option.label}
            </PlayerAppearanceFieldLabel>
            <Select
              value={typeof selectedValue === "string" ? selectedValue : ""}
              onValueChange={(nextValue) => {
                if (typeof nextValue === "string") {
                  onChange({ ...(options ?? {}), [option.id]: nextValue });
                }
              }}
            >
              <SelectTrigger
                aria-label={option.label}
                className="h-7 min-w-24 rounded-md px-2 text-sm"
              >
                {() =>
                  option.choices?.find(
                    (choice) => choice.value === selectedValue,
                  )?.label ?? ""
                }
              </SelectTrigger>
              <SelectContent>
                {option.choices?.map((choice) => (
                  <SelectItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        );
      })}
    </div>
  );
}

function PlayerImageAppearanceButton({
  active,
  asset,
  label,
  onChange,
}: {
  active: boolean;
  asset?: Asset;
  label: string;
  onChange: (asset: Asset) => void;
}) {
  return (
    <label
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      tabIndex={0}
      className={appearanceButtonClassName(active)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.currentTarget.querySelector<HTMLInputElement>("input")?.click();
        }
      }}
    >
      {active && asset?.src ? (
        <span
          className="size-9 rounded-md bg-cover bg-center"
          style={{ backgroundImage: `url("${asset.src}")` }}
        />
      ) : (
        <UploadSimpleIcon className="text-tb-text-secondary size-4" />
      )}
      <input
        type="file"
        accept="image/*,.svg"
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (file) {
            readUploadedAsset(file, onChange);
          }

          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function PlayerAppearanceFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-tb-text-secondary text-xs font-medium">
      {children}
    </span>
  );
}

function appearanceButtonClassName(active: boolean) {
  return cn(
    "border-tb-border-default bg-tb-background-screen hover:bg-tb-neutral-soft focus-visible:focus-ring transition-interactive box-border flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-lg border p-1 outline-hidden",
    active && "border-tb-accent ring-tb-accent/30 ring-2",
  );
}

function readUploadedAsset(file: File, onChange: (asset: Asset) => void) {
  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result === "string") {
      onChange({ src: reader.result });
    }
  };

  reader.readAsDataURL(file);
}
