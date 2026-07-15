import type { Asset, PlayerCaptionStyle } from "../../../core/board/types";
import type { BoardThemePlayerAppearanceDefinition } from "../theme/board-theme";

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

export function getVisiblePlayerAppearanceColorRoles(
  appearance?: BoardThemePlayerAppearanceDefinition,
  options?: Record<string, unknown>,
) {
  return (appearance?.colors ?? []).filter((role) => {
    if (!role.visibleWhen) {
      return true;
    }

    const option = appearance?.options?.find(
      (candidate) => candidate.id === role.visibleWhen?.optionId,
    );
    const value = options?.[role.visibleWhen.optionId] ?? option?.defaultValue;

    return typeof value === "string" && role.visibleWhen.values.includes(value);
  });
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
