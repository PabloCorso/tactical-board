import { DEFAULT_BOARD_COLOR } from "../../../core/colors/default-colors";

const THEME_AWARE_TOOL_ICON_COLORS = new Set<string>([
  DEFAULT_BOARD_COLOR.black,
  DEFAULT_BOARD_COLOR.white,
  DEFAULT_BOARD_COLOR.mediumGray,
  DEFAULT_BOARD_COLOR.lightGray,
]);

export function getThemeAwareToolIconColor(color: string | undefined) {
  if (!color) {
    return color;
  }

  return THEME_AWARE_TOOL_ICON_COLORS.has(color.trim().toLowerCase())
    ? "currentColor"
    : color;
}
