import { describe, expect, it } from "vitest";
import type { Board } from "./types";
import { createBoardPlayerGroup } from "./player-groups";
import {
  getPlayerWithEffectiveStyle,
  resolveEffectivePlayerStyle,
  updatePlayerStyle,
} from "./player-style";
import { createPlayerObject } from "../objects/player-object";

function createStyleBoard(playerGroups: Board["playerGroups"]): Board {
  return {
    id: "style-board",
    version: 1,
    metadata: {},
    frame: {
      width: 100,
      height: 50,
    },
    objects: {
      byId: {},
      order: [],
    },
    style: {},
    playerGroups,
  };
}

describe("resolveEffectivePlayerStyle", () => {
  it("inherits player group defaults when a grouped player has no overrides", () => {
    const group = {
      ...createBoardPlayerGroup({
        id: "player-group-1",
        color: "#1f6feb",
      }),
      style: {
        color: "#1f6feb",
        colors: { secondary: "#ffffff" },
        size: 28,
        fontSize: 12,
        appearanceId: "shirt",
        options: { pattern: "stripes" },
        asset: { src: "asset://team-shirt" },
        caption: { placement: "top" as const, color: "#111827" },
      },
    };
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      groupId: group.id,
    });

    expect(
      resolveEffectivePlayerStyle(createStyleBoard([group]), player),
    ).toEqual({
      color: "#1f6feb",
      colors: { secondary: "#ffffff" },
      size: 28,
      fontSize: 12,
      appearanceId: "shirt",
      options: { pattern: "stripes" },
      asset: { src: "asset://team-shirt" },
      caption: { placement: "top", color: "#111827" },
    });
  });

  it("lets player overrides replace matching player group defaults only", () => {
    const group = {
      ...createBoardPlayerGroup({
        id: "player-group-1",
        color: "#ef4444",
      }),
      style: {
        color: "#ef4444",
        colors: { secondary: "#ffffff" },
        size: 24,
        fontSize: 10,
        appearanceId: "shirt",
        options: { pattern: "solid" },
      },
    };
    const player = updatePlayerStyle(
      createPlayerObject({
        id: "player-1",
        position: { x: 10, y: 10 },
        groupId: group.id,
      }),
      {
        color: "#22c55e",
        asset: { src: "asset://goalkeeper-photo" },
      },
    );

    expect(
      resolveEffectivePlayerStyle(createStyleBoard([group]), player),
    ).toEqual({
      color: "#22c55e",
      colors: { secondary: "#ffffff" },
      size: 24,
      fontSize: 10,
      appearanceId: "shirt",
      options: { pattern: "solid" },
      asset: { src: "asset://goalkeeper-photo" },
      caption: undefined,
    });
  });

  it("uses built-in defaults plus overrides for ungrouped players", () => {
    const player = updatePlayerStyle(
      createPlayerObject({
        id: "player-1",
        position: { x: 10, y: 10 },
      }),
      {
        color: "#f97316",
      },
    );

    expect(
      resolveEffectivePlayerStyle(createStyleBoard([]), player),
    ).toMatchObject({
      color: "#f97316",
      size: 22,
      fontSize: 9.5,
    });
  });

  it("treats pre-override player style fields as legacy materialized style", () => {
    const group = createBoardPlayerGroup({
      id: "player-group-1",
      color: "#1f6feb",
    });
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      groupId: group.id,
      color: "#111827",
      size: { width: 30, height: 30 },
      fontSize: 14,
      appearanceId: "image",
      asset: { src: "asset://legacy-photo" },
    });

    expect(
      resolveEffectivePlayerStyle(createStyleBoard([group]), player),
    ).toEqual({
      color: "#111827",
      colors: undefined,
      size: 30,
      fontSize: 14,
      appearanceId: "image",
      options: undefined,
      asset: { src: "asset://legacy-photo" },
      caption: undefined,
    });
  });
});

describe("getPlayerWithEffectiveStyle", () => {
  it("returns a renderable player object with effective style and caption text", () => {
    const group = {
      ...createBoardPlayerGroup({
        id: "player-group-1",
        color: "#1f6feb",
      }),
      style: {
        color: "#1f6feb",
        size: 26,
        fontSize: 11,
        caption: { placement: "bottom" as const, distance: 2 },
      },
    };
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      groupId: group.id,
      caption: { text: "Alex" },
    });
    const effectivePlayer = getPlayerWithEffectiveStyle(
      createStyleBoard([group]),
      player,
    );

    expect(effectivePlayer.props.color).toBe("#1f6feb");
    expect(effectivePlayer.size).toEqual({ width: 26, height: 26 });
    expect(effectivePlayer.props.caption).toEqual({
      text: "Alex",
      style: { placement: "bottom", distance: 2 },
    });
  });
});
