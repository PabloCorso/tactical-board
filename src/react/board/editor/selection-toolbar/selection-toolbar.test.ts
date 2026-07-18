import { describe, expect, it } from "vitest";
import { shouldShowSelectionToolbar } from "./selection-toolbar";

describe("shouldShowSelectionToolbar", () => {
  it("shows editing controls only for an interactive Selection", () => {
    const selectState = { interaction: undefined };

    expect(
      shouldShowSelectionToolbar(selectState, ["object-1"], "interactive"),
    ).toBe(true);
    expect(
      shouldShowSelectionToolbar(selectState, ["object-1"], "passive"),
    ).toBe(false);
    expect(
      shouldShowSelectionToolbar(selectState, ["object-1"], "hidden"),
    ).toBe(false);
  });
});
