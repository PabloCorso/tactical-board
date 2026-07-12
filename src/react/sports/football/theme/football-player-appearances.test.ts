import { describe, expect, it, vi } from "vitest";
import type { Board } from "../../../../core/board/types";
import { createBoardSpaceProjection } from "../../../../core/geometry/board-space-projection";
import {
  createPlayerObject,
  type PlayerObject,
} from "../../../../core/objects/player-object";
import {
  renderFootballCirclePlayerAppearance,
  renderFootballShirtPlayerAppearance,
} from "./football-player-appearances";

function createSpyContext() {
  const lineWidths: number[] = [];
  const fillStyles: unknown[] = [];
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    fillStyles,
    lineWidths,
  };

  Object.defineProperty(context, "fillStyle", {
    set(value: unknown) {
      fillStyles.push(value);
    },
  });
  Object.defineProperty(context, "lineWidth", {
    set(value: number) {
      lineWidths.push(value);
    },
  });

  return context as unknown as CanvasRenderingContext2D & {
    arc: ReturnType<typeof vi.fn>;
    bezierCurveTo: ReturnType<typeof vi.fn>;
    clip: ReturnType<typeof vi.fn>;
    fillRect: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    fillStyles: unknown[];
    lineWidths: number[];
    stroke: ReturnType<typeof vi.fn>;
  };
}

function createPlayerAppearanceBoard(player: PlayerObject): Board {
  return {
    id: "player-appearance-board",
    version: 1,
    metadata: {},
    frame: {
      width: 100,
      height: 50,
    },
    objects: {
      byId: {
        [player.id]: player,
      },
      order: [player.id],
    },
    style: {},
  };
}

describe("renderFootballShirtPlayerAppearance", () => {
  it("renders the shirt as the marker without a circular backing", () => {
    const context = createSpyContext();
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      size: { width: 2.4, height: 2.4 },
      color: "#1f6feb",
      colors: {
        shirt: "#1f6feb",
        trim: "#ffffff",
      },
      appearanceId: "football-shirt",
    });
    const frameTransform = createBoardSpaceProjection({
      frame: {
        width: 100,
        height: 50,
      },
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
      canvasRect: {
        width: 1000,
        height: 500,
      },
    });

    renderFootballShirtPlayerAppearance({
      context,
      board: createPlayerAppearanceBoard(player),
      object: player,
      player,
      appearance: "default",
      requestRender: () => {},
      frameTransform,
    });

    const scale = 2.4 / 1254;

    expect(context.moveTo).toHaveBeenCalledTimes(6);
    expect(context.moveTo).toHaveBeenCalledWith(
      (940 - 627) * scale,
      (490 - 627) * scale,
    );
    expect(context.bezierCurveTo).toHaveBeenCalledWith(
      (941.727722 - 627) * scale,
      (492.0466 - 627) * scale,
      (942.110046 - 627) * scale,
      (494.233582 - 627) * scale,
      (940.484863 - 627) * scale,
      (496.489105 - 627) * scale,
    );
    expect(context.stroke).toHaveBeenCalledTimes(4);
    expect(context.fill).toHaveBeenCalledTimes(1);
    expect(context.fillStyles).toEqual(["#1f6feb"]);
    expect(context.fillRect).not.toHaveBeenCalled();
    expect(context.clip).not.toHaveBeenCalled();
    expect(context.arc).not.toHaveBeenCalled();
  });
});

describe("renderFootballCirclePlayerAppearance", () => {
  it("uses an explicit player label color", () => {
    const context = createSpyContext();
    const player = createPlayerObject({
      id: "player-label-color",
      position: { x: 10, y: 10 },
      label: "8",
      labelColor: "#ff00ff",
      size: { width: 2.4, height: 2.4 },
      color: "#1f6feb",
      appearanceId: "circle",
    });
    const frameTransform = createBoardSpaceProjection({
      frame: { width: 100, height: 50 },
      viewport: { pan: { x: 0, y: 0 }, zoom: 1 },
      canvasRect: { width: 1000, height: 500 },
    });

    renderFootballCirclePlayerAppearance({
      context,
      board: createPlayerAppearanceBoard(player),
      object: player,
      player,
      appearance: "default",
      requestRender: () => {},
      frameTransform,
    });

    expect(context.fillStyles.at(-1)).toBe("#ff00ff");
  });

  it("contrasts an automatic label against the secondary stripe at its center", () => {
    const context = createSpyContext();
    const player = createPlayerObject({
      id: "striped-player-label",
      position: { x: 10, y: 10 },
      label: "8",
      size: { width: 2.4, height: 2.4 },
      color: "#111827",
      colors: { secondary: "#ffffff" },
      appearanceId: "circle",
      options: { pattern: "stripes" },
    });
    const frameTransform = createBoardSpaceProjection({
      frame: { width: 100, height: 50 },
      viewport: { pan: { x: 0, y: 0 }, zoom: 1 },
      canvasRect: { width: 1000, height: 500 },
    });

    renderFootballCirclePlayerAppearance({
      context,
      board: createPlayerAppearanceBoard(player),
      object: player,
      player,
      appearance: "default",
      requestRender: () => {},
      frameTransform,
    });

    expect(context.fillStyles.at(-1)).toBe("#111827");
  });

  it("renders circle stripes inside the circular marker", () => {
    const context = createSpyContext();
    const player = createPlayerObject({
      id: "player-1",
      position: { x: 10, y: 10 },
      size: { width: 2.4, height: 2.4 },
      color: "#1f6feb",
      colors: {
        secondary: "#ffffff",
      },
      appearanceId: "circle",
      options: {
        pattern: "stripes",
      },
    });
    const frameTransform = createBoardSpaceProjection({
      frame: {
        width: 100,
        height: 50,
      },
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
      canvasRect: {
        width: 1000,
        height: 500,
      },
    });

    renderFootballCirclePlayerAppearance({
      context,
      board: createPlayerAppearanceBoard(player),
      object: player,
      player,
      appearance: "default",
      requestRender: () => {},
      frameTransform,
    });

    expect(context.arc).toHaveBeenCalled();
    expect(context.clip).toHaveBeenCalledTimes(1);
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillStyles).toContain("#1f6feb");
    expect(context.fillStyles).toContain("#ffffff");
  });
});
