import type {
  BoardTheme,
  BoardThemePlayerAppearanceDefinition,
  BoardThemePlayerPresetDefinition,
} from "../theme/board-theme";
import { getThemePlayerAppearanceDefinitions } from "../theme/board-theme";
import { DEFAULT_PLAYER_APPEARANCE_ID } from "../../../core/tools/player-appearance";
import type { PlayerAppearanceFieldValue } from "./player-appearance-fields";

export function getPlayerPresetAppearance(
  theme: Pick<BoardTheme, "playerAppearances"> | undefined,
  preset: Pick<BoardThemePlayerPresetDefinition, "appearanceId">,
): BoardThemePlayerAppearanceDefinition | undefined {
  return getThemePlayerAppearanceDefinitions(theme).find(
    (appearance) => appearance.id === preset.appearanceId,
  );
}

/**
 * Applies a preset while carrying over role colors the target appearance
 * shares with the current style, so team colors survive preset switches.
 */
export function getPlayerPresetChangePatch({
  current,
  preset,
  appearance,
}: {
  current: Pick<PlayerAppearanceFieldValue, "colors">;
  preset: BoardThemePlayerPresetDefinition;
  appearance?: BoardThemePlayerAppearanceDefinition;
}): Partial<PlayerAppearanceFieldValue> {
  const carriedColors: Record<string, string> = {};

  for (const role of appearance?.colors ?? []) {
    const currentValue = current.colors?.[role.id];

    if (currentValue) {
      carriedColors[role.id] = currentValue;
    }
  }

  const colors = {
    ...(appearance?.defaultProps?.colors ?? {}),
    ...(preset.colors ?? {}),
    ...carriedColors,
  };
  const options = {
    ...(appearance?.defaultProps?.options ?? {}),
    ...(preset.options ?? {}),
  };

  return {
    appearanceId: preset.appearanceId,
    colors: Object.keys(colors).length > 0 ? colors : undefined,
    options: Object.keys(options).length > 0 ? options : undefined,
    asset: undefined,
  };
}

export function isPlayerPresetActive(
  preset: BoardThemePlayerPresetDefinition,
  value: Pick<PlayerAppearanceFieldValue, "appearanceId" | "options">,
  appearance?: BoardThemePlayerAppearanceDefinition,
) {
  const valueAppearanceId = value.appearanceId ?? DEFAULT_PLAYER_APPEARANCE_ID;

  if (valueAppearanceId !== preset.appearanceId) {
    return false;
  }

  return Object.entries(preset.options ?? {}).every(
    ([optionId, optionValue]) => {
      const currentValue =
        value.options?.[optionId] ??
        appearance?.options?.find((option) => option.id === optionId)
          ?.defaultValue;

      return currentValue === optionValue;
    },
  );
}
