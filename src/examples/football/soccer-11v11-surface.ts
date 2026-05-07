import type { BoardSurfaceConfig } from "../../core/board/types";

export const soccer11v11Surface: BoardSurfaceConfig = {
  presetId: "soccer-11v11",
  width: 105,
  height: 68,
  background: "pitch",
  markup: {
    centerCircle: true,
    penaltyBoxes: true,
    halfwayLine: true,
  },
};
