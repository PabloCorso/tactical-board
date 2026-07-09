import { describe, expect, it } from "vitest";
import { createPlayerObject, updatePlayerObject } from "./player-object";

describe("updatePlayerObject", () => {
  it("clears optional appearance props when explicitly reset", () => {
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      color: "#1f6feb",
      colors: {
        shirt: "#1f6feb",
        trim: "#ffffff",
      },
      appearanceId: "football-shirt",
      options: {
        pattern: "stripes",
      },
      asset: {
        src: "asset://shirt",
      },
      caption: {
        text: "Nine",
        style: {
          placement: "top",
        },
      },
    });

    const updated = updatePlayerObject(player, {
      colors: undefined,
      appearanceId: undefined,
      options: undefined,
      asset: undefined,
      caption: undefined,
    });

    expect(updated.props.colors).toBeUndefined();
    expect(updated.props.appearanceId).toBeUndefined();
    expect(updated.props.options).toBeUndefined();
    expect(updated.props.asset).toBeUndefined();
    expect(updated.props.caption).toBeUndefined();
  });
});
