import {
  ArrowCounterClockwiseIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { Asset, PlayerCaptionStyle } from "../../../core/board/types";
import {
  type BoardThemePlayerAppearanceDefinition,
  type PlayerAppearanceRendererRegistry,
} from "../theme/board-theme";
import { getThemePlayerAppearanceDefinitions } from "../theme/board-theme";
import { createPlayerObject } from "../../../core/objects/player-object";
import { DEFAULT_PLAYER_SIZE } from "../../../core/objects/player-object";
import { DEFAULT_PLAYER_APPEARANCE_ID } from "../../../core/tools/player-appearance";
import {
  createPlayerRenderer,
  renderPlayer,
} from "../../../core/tools/player-tool";
import { cn } from "../../ui/misc";
import { BoardToolIconCanvas } from "../toolbar/tool-icon-canvas";
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
  size?: number;
  fontSize?: number;
  labelColor?: string;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaptionStyle;
};

const MIN_PLAYER_SIZE = 12;
const MAX_PLAYER_SIZE = 80;

export type PlayerAppearanceFieldsProps = {
  appearanceRenderers?: PlayerAppearanceRendererRegistry;
  appearances?: BoardThemePlayerAppearanceDefinition[];
  labels: ReturnType<typeof useBoardEditorLabels>;
  onChange: (patch: Partial<PlayerAppearanceFieldValue>) => void;
  value: PlayerAppearanceFieldValue;
};

export function PlayerAppearanceFields({
  appearanceRenderers,
  appearances: appearanceDefinitions,
  labels,
  onChange,
  value,
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
    <div className="flex w-full min-w-0 flex-col gap-3 p-1">
      <div className="flex flex-col gap-1.5">
        <PlayerAppearanceFieldLabel>
          {labels.playerAppearance.appearance}
        </PlayerAppearanceFieldLabel>
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
                  onChange(
                    getPlayerAppearanceFieldChangePatch(candidate, value),
                  )
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

export function getPlayerAppearanceFieldChangePatch(
  appearance: BoardThemePlayerAppearanceDefinition,
  current: PlayerAppearanceFieldValue,
) {
  const colors = Object.fromEntries(
    (appearance.colors ?? []).map((role) => [
      role.id,
      current.colors?.[role.id] ??
        appearance.defaultProps?.colors?.[role.id] ??
        role.defaultValue ??
        current.color,
    ]),
  );
  const options = Object.fromEntries(
    (appearance.options ?? []).map((option) => [
      option.id,
      current.options?.[option.id] ??
        appearance.defaultProps?.options?.[option.id] ??
        option.defaultValue,
    ]),
  );

  return getPlayerAppearanceChangePatch(appearance, {
    colors: Object.keys(colors).length > 0 ? colors : undefined,
    options: Object.keys(options).length > 0 ? options : undefined,
  });
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
