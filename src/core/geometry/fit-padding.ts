import type { FitPadding, FitPaddingInsets } from "./types";

export const DEFAULT_FIT_PADDING_INSETS: FitPaddingInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function getFitPaddingInsets(
  fitPadding: FitPadding | undefined,
): FitPaddingInsets {
  if (fitPadding === undefined) {
    return DEFAULT_FIT_PADDING_INSETS;
  }

  if (typeof fitPadding === "number") {
    return {
      top: fitPadding,
      right: fitPadding,
      bottom: fitPadding,
      left: fitPadding,
    };
  }

  if ("x" in fitPadding) {
    return {
      top: fitPadding.y,
      right: fitPadding.x,
      bottom: fitPadding.y,
      left: fitPadding.x,
    };
  }

  return fitPadding;
}
