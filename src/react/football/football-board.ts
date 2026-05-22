import { createBoard } from "../../core/board/create-board";
import { createArrowObject } from "../../core/objects/arrow-object";
import { createEquipmentObject } from "../../core/objects/equipment-object";
import { createPlayerObject } from "../../core/objects/player-object";
import { createTextObject } from "../../core/objects/text-object";
import {
  createShapeObject,
  type ShapeFillStyle,
  type ShapeKind,
  type ShapeLineStyle,
} from "../../core/objects/shape-object";
import type {
  Board,
  BoardMetadata,
  BoardSurfaceConfig,
  BoardSurfaceMarking,
  BoardStyleRef,
  ObjectIndex,
} from "../../core/board/types";
import { FOOTBALL_PLAYER_PRESET_COLORS } from "./football-catalog";
import { DEFAULT_PRESET_COLOR } from "../../core/colors/preset-colors";
import { FOOTBALL_EQUIPMENT_DEFINITIONS } from "./equipment";
import { metersToPixels, pointMetersToPixels } from "./football-units";
import playerOneImage from "../../assets/player-1.png";

export const FOOTBALL_FULL_PITCH_METRICS = {
  field: { length: 105, width: 68 },
  perimeter: { touchline: 5, goalLine: 3 },
  goal: {
    postsWidth: 7.32,
    areaDepth: 5.5,
  },
  penalty: {
    areaDepth: 16.5,
    spotDistance: 11,
    spotRadius: 0.4,
    arcRadius: 9.15,
  },
  centerCircle: { radius: 9.15, spotRadius: 0.6 },
  cornerArcRadius: 1,
  lineWidth: 0.4,
};

export const FOOTBALL_PITCH_COLORS = {
  outer: "#177238",
  stripeDark: "#257e3f",
  stripeLight: "#2d8747",
  line: "#ffffff",
};

const STRIPE_COUNT = 19;

export function createFootballPitchMarkings(): BoardSurfaceMarking[] {
  const outerMarginX = FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline;
  const outerMarginY = FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine;
  const width = FOOTBALL_FULL_PITCH_METRICS.field.length;
  const height = FOOTBALL_FULL_PITCH_METRICS.field.width;
  const centerX = outerMarginX + width / 2;
  const centerY = outerMarginY + height / 2;

  const goalWidth =
    FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth * 2 +
    FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const goalDepth = FOOTBALL_FULL_PITCH_METRICS.goal.areaDepth;
  const penaltyWidth =
    FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth * 2 +
    FOOTBALL_FULL_PITCH_METRICS.goal.postsWidth;
  const penaltyDepth = FOOTBALL_FULL_PITCH_METRICS.penalty.areaDepth;
  const stripeWidth = width / STRIPE_COUNT;

  const stripes = Array.from({ length: STRIPE_COUNT }, (_, index) => ({
    kind: "rect" as const,
    x: outerMarginX + index * stripeWidth,
    y: outerMarginY,
    width: stripeWidth,
    height,
    fill:
      index % 2 === 0
        ? FOOTBALL_PITCH_COLORS.stripeLight
        : FOOTBALL_PITCH_COLORS.stripeDark,
  }));

  const markings: BoardSurfaceMarking[] = [
    ...stripes,
    {
      kind: "rect",
      x: outerMarginX,
      y: outerMarginY,
      width,
      height,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "line",
      x1: centerX,
      y1: outerMarginY,
      x2: centerX,
      y2: outerMarginY + height,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.centerCircle.radius,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.centerCircle.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - penaltyDepth,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - goalDepth,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "circle",
      cx: outerMarginX + FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
    },
    {
      kind: "circle",
      cx:
        outerMarginX +
        width -
        FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.spotRadius,
      fill: FOOTBALL_PITCH_COLORS.line,
    },
    {
      kind: "arc",
      cx: outerMarginX + FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.arcRadius,
      startAngle: -52,
      endAngle: 52,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx:
        outerMarginX +
        width -
        FOOTBALL_FULL_PITCH_METRICS.penalty.spotDistance,
      cy: centerY,
      r: FOOTBALL_FULL_PITCH_METRICS.penalty.arcRadius,
      startAngle: 128,
      endAngle: 232,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 0,
      endAngle: 90,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 90,
      endAngle: 180,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY + height,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 180,
      endAngle: 270,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY + height,
      r: FOOTBALL_FULL_PITCH_METRICS.cornerArcRadius,
      startAngle: 270,
      endAngle: 360,
      stroke: FOOTBALL_PITCH_COLORS.line,
      strokeWidth: FOOTBALL_FULL_PITCH_METRICS.lineWidth,
    },
  ];

  return markings.map((marking) => {
    switch (marking.kind) {
      case "rect":
        return {
          ...marking,
          x: metersToPixels(marking.x),
          y: metersToPixels(marking.y),
          width: metersToPixels(marking.width),
          height: metersToPixels(marking.height),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
      case "line":
        return {
          ...marking,
          x1: metersToPixels(marking.x1),
          y1: metersToPixels(marking.y1),
          x2: metersToPixels(marking.x2),
          y2: metersToPixels(marking.y2),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
      case "circle":
        return {
          ...marking,
          cx: metersToPixels(marking.cx),
          cy: metersToPixels(marking.cy),
          r: metersToPixels(marking.r),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
      case "arc":
        return {
          ...marking,
          cx: metersToPixels(marking.cx),
          cy: metersToPixels(marking.cy),
          r: metersToPixels(marking.r),
          strokeWidth:
            marking.strokeWidth === undefined
              ? undefined
              : metersToPixels(marking.strokeWidth),
        };
    }
  });
}

const surfaceWidth =
  FOOTBALL_FULL_PITCH_METRICS.field.length +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline * 2;
const surfaceHeight =
  FOOTBALL_FULL_PITCH_METRICS.field.width +
  FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine * 2;
const fieldStartX = FOOTBALL_FULL_PITCH_METRICS.perimeter.touchline;
const fieldStartY = FOOTBALL_FULL_PITCH_METRICS.perimeter.goalLine;

const arrowBodyStyles = ["straight", "curved", "wavy", "double"] as const;
const arrowHeadStyles = ["none", "triangle"] as const;
const arrowLineStyles = ["solid", "dashed"] as const;
const shapeKinds = [
  "rectangle",
  "oval",
  "triangle",
  "diamond",
  "polygon",
] as const satisfies readonly ShapeKind[];
const shapeLineStyles = [
  "solid",
  "dashed",
] as const satisfies readonly ShapeLineStyle[];
const shapeFillStyles = [
  "none",
  "solid",
  "diagonal-stripes",
] as const satisfies readonly ShapeFillStyle[];
const shapeBorderStyles = [true, false] as const;

const arrowShowcaseEntries = arrowBodyStyles.flatMap((kind, bodyIndex) =>
  arrowLineStyles.flatMap((lineStyle, lineStyleIndex) =>
    arrowHeadStyles.flatMap((startHead, startHeadIndex) =>
      arrowHeadStyles.map((endHead, endHeadIndex) => {
        const variantIndex =
          bodyIndex * 8 +
          lineStyleIndex * 4 +
          startHeadIndex * 2 +
          endHeadIndex;
        const row = Math.floor(variantIndex / 4);
        const column = variantIndex % 4;
        const id = [
          "arrow",
          kind,
          lineStyle,
          `start-${startHead}`,
          `end-${endHead}`,
        ].join("-");
        const startX = fieldStartX + 67 + column * 8;
        const startY = fieldStartY + 6 + row * 5.7;

        return [
          id,
          createArrowObject({
            id,
            start: pointMetersToPixels({ x: startX, y: startY }),
            end: pointMetersToPixels({ x: startX + 6.5, y: startY }),
            color: DEFAULT_PRESET_COLOR.black,
            lineStyle,
            kind,
            startHead,
            endHead,
          }),
        ] as const;
      }),
    ),
  ),
);

const arrowShowcaseObjects = Object.fromEntries(arrowShowcaseEntries);
const arrowShowcaseOrder = arrowShowcaseEntries.map(([id]) => id);

const shapeShowcaseEntries = shapeKinds.flatMap((kind, row) =>
  shapeLineStyles.flatMap((lineStyle, lineStyleIndex) =>
    shapeFillStyles.flatMap((fillStyle, fillStyleIndex) =>
      shapeBorderStyles.map((bordered, borderIndex) => {
        const column =
          lineStyleIndex * shapeFillStyles.length * shapeBorderStyles.length +
          fillStyleIndex * shapeBorderStyles.length +
          borderIndex;
        const id = [
          "shape",
          kind,
          lineStyle,
          fillStyle,
          bordered ? "bordered" : "borderless",
        ].join("-");
        const startX = fieldStartX + 4 + column * 5.1;
        const startY = fieldStartY + 6 + row * 5.3;
        const endX = startX + 4.5;
        const endY = startY + 4.5;

        return [
          id,
          createShapeObject({
            id,
            kind,
            color: DEFAULT_PRESET_COLOR.black,
            lineStyle,
            fillStyle,
            bordered,
            ...(kind === "polygon"
              ? {
                  points: [
                    { x: startX + 0.4, y: startY + 4.3 },
                    { x: startX + 1.5, y: startY + 0.4 },
                    { x: startX + 4.2, y: startY + 0.9 },
                    { x: startX + 4.5, y: startY + 3.3 },
                    { x: startX + 2.1, y: startY + 4.5 },
                  ].map(pointMetersToPixels),
                }
              : {
                  start: pointMetersToPixels({ x: startX, y: startY }),
                  end: pointMetersToPixels({ x: endX, y: endY }),
                }),
          }),
        ] as const;
      }),
    ),
  ),
);

const shapeShowcaseObjects = Object.fromEntries(shapeShowcaseEntries);
const shapeShowcaseOrder = shapeShowcaseEntries.map(([id]) => id);

const playerShowcaseEntries = FOOTBALL_PLAYER_PRESET_COLORS.map(
  (color, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const id = `player-showcase-${index + 1}`;

    return [
      id,
      createPlayerObject({
        id,
        position: pointMetersToPixels({
          x: fieldStartX + 6 + column * 4.6,
          y: fieldStartY + 45 + row * 4.8,
        }),
        size: index === 0 ? { width: 40, height: 40 } : undefined,
        color,
        meta: index === 0 ? { imageSrc: playerOneImage } : undefined,
        label: "1",
      }),
    ] as const;
  },
);

const playerShowcaseObjects = Object.fromEntries(playerShowcaseEntries);
const playerShowcaseOrder = playerShowcaseEntries.map(([id]) => id);

const equipmentShowcaseEntries = FOOTBALL_EQUIPMENT_DEFINITIONS.map(
  (definition, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const id = `equipment-showcase-${definition.kind}`;

    return [
      id,
      createEquipmentObject({
        id,
        position: pointMetersToPixels({
          x: fieldStartX + 31 + column * 12,
          y: fieldStartY + 44 + row * 8.5,
        }),
        rotation: 0,
        size: {
          width: definition.defaultSize.width,
          height: definition.defaultSize.height,
        },
        kind: definition.kind,
        color: definition.color,
        definition,
      }),
    ] as const;
  },
);

const equipmentShowcaseObjects = Object.fromEntries(equipmentShowcaseEntries);
const equipmentShowcaseOrder = equipmentShowcaseEntries.map(([id]) => id);

const textShowcaseEntries = [
  [
    "text-showcase-note",
    createTextObject({
      id: "text-showcase-note",
      position: pointMetersToPixels({
        x: fieldStartX + 10,
        y: fieldStartY + 40,
      }),
      text: "Press",
      color: DEFAULT_PRESET_COLOR.black,
      fontSize: 14,
    }),
  ] as const,
];

const textShowcaseObjects = Object.fromEntries(textShowcaseEntries);
const textShowcaseOrder = textShowcaseEntries.map(([id]) => id);

export function createFootballPitchSurface(): BoardSurfaceConfig {
  return {
    width: metersToPixels(surfaceWidth),
    height: metersToPixels(surfaceHeight),
    background: FOOTBALL_PITCH_COLORS.outer,
    markings: createFootballPitchMarkings(),
    markup: {
      sport: "football",
      variant: "full-pitch",
    },
  };
}

export type CreateFootballBoardOptions = {
  id?: string;
  metadata?: BoardMetadata;
  name?: string;
  objects?: ObjectIndex;
  style?: BoardStyleRef;
  surface?: Partial<BoardSurfaceConfig>;
};

export function createFootballBoard({
  id = "football-board",
  metadata,
  name = "Football Board",
  objects = { byId: {}, order: [] },
  style = {},
  surface,
}: CreateFootballBoardOptions = {}): Board {
  return createBoard({
    id,
    version: 1,
    metadata: {
      name,
      ...metadata,
    },
    surface: {
      ...createFootballPitchSurface(),
      ...surface,
    },
    objects,
    style,
  });
}

export const footballShowcaseBoard = createFootballBoard({
  id: "football-showcase-board",
  name: "Football Showcase",
  objects: {
    byId: {
      ...playerShowcaseObjects,
      ...equipmentShowcaseObjects,
      ...textShowcaseObjects,
      ...arrowShowcaseObjects,
      ...shapeShowcaseObjects,
    },
    order: [
      ...playerShowcaseOrder,
      ...equipmentShowcaseOrder,
      ...textShowcaseOrder,
      ...arrowShowcaseOrder,
      ...shapeShowcaseOrder,
    ],
  },
});
