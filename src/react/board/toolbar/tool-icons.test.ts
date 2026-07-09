import { describe, expect, it } from "vitest";
import { DEFAULT_BOARD_COLOR } from "../../../core/colors/default-colors";
import {
  DEFAULT_PLAYER_FONT_SIZE,
  DEFAULT_PLAYER_SIZE,
} from "../../../core/objects/player-object";
import {
  createPlayerToolIconPreviewObject,
  getThemeAwareToolIconColor,
} from "./tool-icons";

describe("toolbar tool icons", () => {
  it("caps player preview label font size to the marker size ratio", () => {
    const player = createPlayerToolIconPreviewObject({
      draftStyle: {
        color: "#ef4444",
        size: 2.4,
        fontSize: DEFAULT_PLAYER_FONT_SIZE,
      },
      label: "1",
    });

    expect(player.size).toEqual({ width: 2.4, height: 2.4 });
    expect(player.props.fontSize).toBeCloseTo(
      2.4 * (DEFAULT_PLAYER_FONT_SIZE / DEFAULT_PLAYER_SIZE),
    );
  });

  it("preserves intentionally smaller player preview label font sizes", () => {
    const player = createPlayerToolIconPreviewObject({
      draftStyle: {
        color: "#ef4444",
        size: DEFAULT_PLAYER_SIZE,
        fontSize: 3,
      },
      label: "1",
    });

    expect(player.props.fontSize).toBe(3);
  });

  it("lets neutral player preview colors follow the toolbar icon color", () => {
    const player = createPlayerToolIconPreviewObject({
      draftStyle: {
        color: DEFAULT_BOARD_COLOR.black,
        size: DEFAULT_PLAYER_SIZE,
        fontSize: DEFAULT_PLAYER_FONT_SIZE,
      },
    });

    expect(getThemeAwareToolIconColor(DEFAULT_BOARD_COLOR.black)).toBe(
      "currentColor",
    );
    expect(player.props.color).toBe("currentColor");
  });
});
