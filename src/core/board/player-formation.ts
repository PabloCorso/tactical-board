import type { BoardFrameDefault, Point } from "./types";

/** The frame axis the formation advances along. */
export type FormationAxis = "x" | "y";

/** Which end of the axis the goalkeeper defends. */
export type FormationSide = "start" | "end";

/** Whether the formation occupies one half of the axis or all of it. */
export type FormationSpan = "half" | "full";

export type FormationLayout = {
  /** Outfield rows from the own goal toward the attacking end. */
  rows: number[];
  /** Include a goalkeeper row before the outfield rows. Defaults to true. */
  goalkeeper?: boolean;
};

export type FormationPlacement = {
  axis?: FormationAxis;
  side?: FormationSide;
  span?: FormationSpan;
};

const DEPTHS = {
  half: { goalkeeper: 0.09, firstRow: 0.34, lastRow: 0.9 },
  full: { goalkeeper: 0.05, firstRow: 0.22, lastRow: 0.86 },
} as const;

function getFormationRowCounts(layout: FormationLayout) {
  return layout.rows
    .filter((count) => Number.isFinite(count) && Math.floor(count) > 0)
    .map((count) => Math.floor(count));
}

export function getFormationPlayerCount(layout: FormationLayout) {
  const outfield = getFormationRowCounts(layout).reduce(
    (total, count) => total + count,
    0,
  );

  return outfield + (layout.goalkeeper === false ? 0 : 1);
}

export function getDefaultFormationAxis(
  frame: Pick<BoardFrameDefault, "width" | "height">,
): FormationAxis {
  return frame.width >= frame.height ? "x" : "y";
}

function getRowDepths(layout: FormationLayout, span: FormationSpan) {
  const rows = getFormationRowCounts(layout);
  const constants = DEPTHS[span];
  const depths: Array<{ depth: number; count: number }> = [];

  if (layout.goalkeeper !== false) {
    depths.push({ depth: constants.goalkeeper, count: 1 });
  }

  rows.forEach((count, index) => {
    const step =
      rows.length > 1
        ? (constants.lastRow - constants.firstRow) / (rows.length - 1)
        : 0;
    const depth =
      rows.length > 1
        ? constants.firstRow + step * index
        : (constants.firstRow + constants.lastRow) / 2;

    depths.push({ depth, count });
  });

  return depths;
}

/**
 * Positions a formation on the frame. The formation advances along `axis`
 * starting from the `side` end (where the goalkeeper stands) and covers
 * either that half of the axis or the full frame. Positions are returned
 * goalkeeper first, then each row from defense to attack.
 */
export function getFormationPositions({
  frame,
  layout,
  placement = {},
}: {
  frame: Pick<BoardFrameDefault, "width" | "height">;
  layout: FormationLayout;
  placement?: FormationPlacement;
}): Point[] {
  const axis = placement.axis ?? getDefaultFormationAxis(frame);
  const side = placement.side ?? "start";
  const span = placement.span ?? "half";
  const alongExtent = axis === "x" ? frame.width : frame.height;
  const crossExtent = axis === "x" ? frame.height : frame.width;
  const spanExtent = span === "half" ? alongExtent / 2 : alongExtent;
  const positions: Point[] = [];

  for (const row of getRowDepths(layout, span)) {
    for (let index = 0; index < row.count; index += 1) {
      const along =
        side === "start"
          ? row.depth * spanExtent
          : alongExtent - row.depth * spanExtent;
      const cross = (crossExtent * (index + 1)) / (row.count + 1);

      positions.push(
        axis === "x" ? { x: along, y: cross } : { x: cross, y: along },
      );
    }
  }

  return positions;
}
