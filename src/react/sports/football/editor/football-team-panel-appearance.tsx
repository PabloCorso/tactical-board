import {
  ArrowCounterClockwiseIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useBoardEditorTeamPanelActiveGroup } from "../../../board/team/team-panel";
import { applyPlayerGroupStylePatch } from "../../../board/team/player-team-commands";
import {
  PlayerAppearanceColorPicker,
  PlayerAppearancePreview,
  readUploadedAsset,
} from "../../../board/player/player-appearance-fields";
import { useBoardEditorLabels } from "../../../board/editor/board-editor-labels";
import { DEFAULT_PLAYER_SIZE } from "../../../../core/objects/player-object";
import { Button } from "../../../ui/button";
import { cn } from "../../../ui/misc";
import { Slider } from "../../../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../ui/select";
import {
  TeamPanelSection,
  TeamPanelSectionTitle,
} from "../../../board/team/team-panel-section";
import {
  FOOTBALL_PLAYER_APPEARANCES,
  FOOTBALL_PLAYER_APPEARANCE_RENDERERS,
  FOOTBALL_SECONDARY_COLOR_ROLE,
  FOOTBALL_SHIRT_APPEARANCE_ID,
  type FootballCirclePattern,
} from "../theme/football-player-appearances";

const IMAGE_APPEARANCE_ID = "image";
const CIRCLE_APPEARANCE_ID = "circle";
const DEFAULT_PLAYER_COLOR = "#111827";
const DEFAULT_SECONDARY_COLOR = "#ffffff";
const MIN_PLAYER_SIZE = 12;
const MAX_PLAYER_SIZE = 80;
const PLAYER_SIZE_STEP = 1;

const PATTERNS: Array<{ label: string; value: FootballCirclePattern }> = [
  { value: "solid", label: "Solid" },
  { value: "stripes", label: "Stripes" },
  { value: "hoops", label: "Hoops" },
  { value: "halves", label: "Halves" },
  { value: "sash", label: "Sash" },
];

const FOOTBALL_APPEARANCE_IDS = [
  CIRCLE_APPEARANCE_ID,
  FOOTBALL_SHIRT_APPEARANCE_ID,
] as const;

export function FootballTeamPanelAppearance() {
  const labels = useBoardEditorLabels();
  const { group, toolApi } = useBoardEditorTeamPanelActiveGroup();
  const appearanceId = group.style.appearanceId ?? CIRCLE_APPEARANCE_ID;
  const appearance = FOOTBALL_PLAYER_APPEARANCES.find(
    (candidate) => candidate.id === appearanceId,
  );
  const color = group.style.color ?? DEFAULT_PLAYER_COLOR;
  const pattern = readPattern(group.style.options?.pattern);
  const secondaryColor =
    group.style.colors?.[FOOTBALL_SECONDARY_COLOR_ROLE] ??
    DEFAULT_SECONDARY_COLOR;
  const isImage = appearanceId === IMAGE_APPEARANCE_ID;
  const playerSize = group.style.size ?? DEFAULT_PLAYER_SIZE;

  const updateStyle = (
    patch: Parameters<typeof applyPlayerGroupStylePatch>[2],
  ) => applyPlayerGroupStylePatch(toolApi, group.id, patch);

  const setAppearance = (
    nextAppearanceId: (typeof FOOTBALL_APPEARANCE_IDS)[number],
  ) =>
    updateStyle({
      appearanceId: nextAppearanceId,
      asset: undefined,
      colors: {
        [FOOTBALL_SECONDARY_COLOR_ROLE]: secondaryColor,
      },
      options: { pattern },
    });

  return (
    <TeamPanelSection>
      <TeamPanelSectionTitle>{labels.teamPanel.kit}</TeamPanelSectionTitle>
      <div
        role="radiogroup"
        aria-label={labels.teamPanel.kit}
        className="grid grid-cols-3 gap-1.5"
      >
        {FOOTBALL_APPEARANCE_IDS.map((id) => {
          const candidate = FOOTBALL_PLAYER_APPEARANCES.find(
            (item) => item.id === id,
          );

          if (!candidate) {
            return null;
          }

          const active = appearanceId === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={candidate.label}
              title={candidate.label}
              className={appearanceButtonClassName(active)}
              onClick={() => setAppearance(id)}
            >
              <PlayerAppearancePreview
                appearanceRenderers={FOOTBALL_PLAYER_APPEARANCE_RENDERERS}
                appearance={candidate}
                color={color}
                colors={{ [FOOTBALL_SECONDARY_COLOR_ROLE]: secondaryColor }}
                options={{ pattern }}
              />
            </button>
          );
        })}
        <ImageAppearanceButton
          active={isImage}
          asset={group.style.asset}
          ariaLabel={labels.teamPanel.uploadImage}
          onChange={(asset) =>
            updateStyle({
              appearanceId: IMAGE_APPEARANCE_ID,
              asset,
              colors: undefined,
              options: undefined,
            })
          }
        />
      </div>

      {!isImage && appearance ? (
        <>
          <div
            className={cn("flex gap-1", {
              "flex-wrap": pattern !== "solid",
            })}
          >
            <FootballPatternPicker
              appearance={appearance}
              color={color}
              pattern={pattern}
              secondaryColor={secondaryColor}
              onChange={(nextPattern) =>
                updateStyle({
                  options: { pattern: nextPattern },
                })
              }
            />
            <PlayerAppearanceColorPicker
              ariaLabel={labels.secondaryToolbar.playerColor}
              chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
              value={color}
              className="h-6"
              onChange={(nextColor) => updateStyle({ color: nextColor })}
            />
            {pattern !== "solid" ? (
              <PlayerAppearanceColorPicker
                ariaLabel="Secondary color"
                chooseCustomColorLabel={labels.colorPicker.chooseCustomColor}
                value={secondaryColor}
                className="h-6"
                onChange={(nextColor) =>
                  updateStyle({
                    colors: {
                      [FOOTBALL_SECONDARY_COLOR_ROLE]: nextColor,
                    },
                  })
                }
              />
            ) : null}
          </div>
        </>
      ) : null}

      <div className="flex flex-col">
        <div className="flex min-h-4 items-center justify-between">
          <span className="text-tb-text-secondary text-xs font-medium">
            {labels.teamPanel.playerSize}
          </span>
          {playerSize !== DEFAULT_PLAYER_SIZE ? (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={labels.teamPanel.resetPlayerSize}
              title={labels.teamPanel.resetPlayerSize}
              className="text-tb-text-secondary size-4 rounded-sm"
              iconBefore={<ArrowCounterClockwiseIcon />}
              iconSize="xs"
              onClick={() => updateStyle({ size: DEFAULT_PLAYER_SIZE })}
            />
          ) : null}
        </div>
        <Slider
          aria-label={labels.teamPanel.playerSize}
          thumbAriaLabel={labels.teamPanel.playerSize}
          controlClassName="h-6"
          min={MIN_PLAYER_SIZE}
          max={MAX_PLAYER_SIZE}
          step={PLAYER_SIZE_STEP}
          largeStep={10}
          value={Math.min(
            MAX_PLAYER_SIZE,
            Math.max(MIN_PLAYER_SIZE, playerSize),
          )}
          onValueChange={(size) => updateStyle({ size })}
        />
      </div>
    </TeamPanelSection>
  );
}

function FootballPatternPicker({
  appearance,
  color,
  pattern,
  secondaryColor,
  onChange,
}: {
  appearance: (typeof FOOTBALL_PLAYER_APPEARANCES)[number];
  color: string;
  pattern: FootballCirclePattern;
  secondaryColor: string;
  onChange: (pattern: FootballCirclePattern) => void;
}) {
  const selectedPattern =
    PATTERNS.find((candidate) => candidate.value === pattern) ?? PATTERNS[0];

  return (
    <Select
      value={pattern}
      onValueChange={(value) => {
        if (isFootballPattern(value)) {
          onChange(value);
        }
      }}
    >
      <SelectTrigger
        aria-label="Pattern"
        className="h-6 rounded-md px-2 text-sm"
      >
        {() => selectedPattern.label}
      </SelectTrigger>
      <SelectContent>
        {PATTERNS.map((candidate) => (
          <SelectItem key={candidate.value} value={candidate.value}>
            <span className="flex items-center gap-2">
              <PlayerAppearancePreview
                appearanceRenderers={FOOTBALL_PLAYER_APPEARANCE_RENDERERS}
                appearance={appearance}
                color={color}
                colors={{ [FOOTBALL_SECONDARY_COLOR_ROLE]: secondaryColor }}
                options={{ pattern: candidate.value }}
              />
              <span>{candidate.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ImageAppearanceButton({
  active,
  asset,
  ariaLabel,
  onChange,
}: {
  active: boolean;
  asset: { src: string } | undefined;
  ariaLabel: string;
  onChange: (asset: { src: string }) => void;
}) {
  return (
    <label
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel}
      title={ariaLabel}
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
          className="size-full rounded-sm bg-cover bg-center"
          style={{ backgroundImage: `url("${asset.src}")` }}
        />
      ) : (
        <UploadSimpleIcon className="text-tb-text-secondary size-4 shrink-0" />
      )}
      <input
        type="file"
        accept="image/*,.svg"
        className="sr-only"
        tabIndex={-1}
        aria-label={ariaLabel}
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

function appearanceButtonClassName(active: boolean) {
  return cn(
    "border-tb-border-default bg-tb-background-screen hover:bg-tb-neutral-soft focus-visible:focus-ring transition-interactive box-border flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-md border p-1 outline-hidden",
    active && "border-tb-accent ring-tb-accent/30 ring-2",
  );
}

function readPattern(value: unknown): FootballCirclePattern {
  return isFootballPattern(value) ? value : "solid";
}

function isFootballPattern(value: unknown): value is FootballCirclePattern {
  return PATTERNS.some((pattern) => pattern.value === value);
}
