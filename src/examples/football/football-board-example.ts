import { createBoard } from "../../core/board/create-board";
import { createArrowObject } from "../../core/objects/arrow-object";
import { createEquipmentObject } from "../../core/objects/equipment-object";
import { createPlayerObject } from "../../core/objects/player-object";
import {
  createShapeObject,
  type ShapeFillStyle,
  type ShapeKind,
  type ShapeLineStyle,
} from "../../core/objects/shape-object";
import type { BoardSurfaceMarking } from "../../core/board/types";
import {
  FOOTBALL_PLAYER_PRESET_COLORS,
  PLAYER_SHIRT_SVG_BY_COLOR,
} from "./football-example-catalog";
import { FOOTBALL_EQUIPMENT_DEFINITIONS } from "./equipment";

const pitchMetrics = {
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

const pitchColors = {
  outer: "#177238",
  stripeDark: "#257e3f",
  stripeLight: "#2d8747",
  line: "#ffffff",
};

const STRIPE_COUNT = 19;

function createFootballPitchMarkings(): BoardSurfaceMarking[] {
  const outerMarginX = pitchMetrics.perimeter.touchline;
  const outerMarginY = pitchMetrics.perimeter.goalLine;
  const width = pitchMetrics.field.length;
  const height = pitchMetrics.field.width;
  const centerX = outerMarginX + width / 2;
  const centerY = outerMarginY + height / 2;

  const goalWidth =
    pitchMetrics.goal.areaDepth * 2 + pitchMetrics.goal.postsWidth;
  const goalDepth = pitchMetrics.goal.areaDepth;
  const penaltyWidth =
    pitchMetrics.penalty.areaDepth * 2 + pitchMetrics.goal.postsWidth;
  const penaltyDepth = pitchMetrics.penalty.areaDepth;
  const stripeWidth = width / STRIPE_COUNT;

  const stripes = Array.from({ length: STRIPE_COUNT }, (_, index) => ({
    kind: "rect" as const,
    x: outerMarginX + index * stripeWidth,
    y: outerMarginY,
    width: stripeWidth,
    height,
    fill: index % 2 === 0 ? pitchColors.stripeLight : pitchColors.stripeDark,
  }));

  return [
    ...stripes,
    {
      kind: "rect",
      x: outerMarginX,
      y: outerMarginY,
      width,
      height,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "line",
      x1: centerX,
      y1: outerMarginY,
      x2: centerX,
      y2: outerMarginY + height,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: pitchMetrics.centerCircle.radius,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "circle",
      cx: centerX,
      cy: centerY,
      r: pitchMetrics.centerCircle.spotRadius,
      fill: pitchColors.line,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - penaltyDepth,
      y: centerY - penaltyWidth / 2,
      width: penaltyDepth,
      height: penaltyWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "rect",
      x: outerMarginX + width - goalDepth,
      y: centerY - goalWidth / 2,
      width: goalDepth,
      height: goalWidth,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "circle",
      cx: outerMarginX + pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.spotRadius,
      fill: pitchColors.line,
    },
    {
      kind: "circle",
      cx: outerMarginX + width - pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.spotRadius,
      fill: pitchColors.line,
    },
    {
      kind: "arc",
      cx: outerMarginX + pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.arcRadius,
      startAngle: -52,
      endAngle: 52,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width - pitchMetrics.penalty.spotDistance,
      cy: centerY,
      r: pitchMetrics.penalty.arcRadius,
      startAngle: 128,
      endAngle: 232,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 0,
      endAngle: 90,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 90,
      endAngle: 180,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX + width,
      cy: outerMarginY + height,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 180,
      endAngle: 270,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
    {
      kind: "arc",
      cx: outerMarginX,
      cy: outerMarginY + height,
      r: pitchMetrics.cornerArcRadius,
      startAngle: 270,
      endAngle: 360,
      stroke: pitchColors.line,
      strokeWidth: pitchMetrics.lineWidth,
    },
  ];
}

const surfaceWidth =
  pitchMetrics.field.length + pitchMetrics.perimeter.touchline * 2;
const surfaceHeight =
  pitchMetrics.field.width + pitchMetrics.perimeter.goalLine * 2;
const fieldStartX = pitchMetrics.perimeter.touchline;
const fieldStartY = pitchMetrics.perimeter.goalLine;

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

const arrowExampleEntries = arrowBodyStyles.flatMap((bodyStyle, bodyIndex) =>
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
          bodyStyle,
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
            start: { x: startX, y: startY },
            end: { x: startX + 6.5, y: startY },
            color: "black",
            lineStyle,
            bodyStyle,
            startHead,
            endHead,
          }),
        ] as const;
      }),
    ),
  ),
);

const arrowExampleObjects = Object.fromEntries(arrowExampleEntries);
const arrowExampleOrder = arrowExampleEntries.map(([id]) => id);

const shapeExampleEntries = shapeKinds.flatMap((kind, row) =>
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
            color: "black",
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
                  ],
                }
              : {
                  start: { x: startX, y: startY },
                  end: { x: endX, y: endY },
                }),
          }),
        ] as const;
      }),
    ),
  ),
);

const shapeExampleObjects = Object.fromEntries(shapeExampleEntries);
const shapeExampleOrder = shapeExampleEntries.map(([id]) => id);

const playerExampleEntries = FOOTBALL_PLAYER_PRESET_COLORS.map(
  (color, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const id = `player-example-${index + 1}`;

    return [
      id,
      createPlayerObject({
        id,
        position: {
          x: fieldStartX + 6 + column * 4.6,
          y: fieldStartY + 45 + row * 4.8,
        },
        color,
        appearance:
          index === 0
            ? {
                kind: "svg",
                svg: PLAYER_SHIRT_SVG_BY_COLOR[color],
              }
            : undefined,
        label: "1",
      }),
    ] as const;
  },
);

const playerExampleObjects = Object.fromEntries(playerExampleEntries);
const playerExampleOrder = playerExampleEntries.map(([id]) => id);

const equipmentExampleEntries = FOOTBALL_EQUIPMENT_DEFINITIONS.map(
  (definition, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const id = `equipment-example-${definition.kind}`;

    return [
      id,
      createEquipmentObject({
        id,
        position: {
          x: fieldStartX + 31 + column * 12,
          y: fieldStartY + 44 + row * 8.5,
        },
        rotation: 0,
        size: {
          width: definition.defaultSize.width,
          height: definition.defaultSize.height,
          mode: "world",
          unit: "m",
        },
        unit: "m",
        kind: definition.kind,
        color: definition.color,
        definition,
      }),
    ] as const;
  },
);

const equipmentExampleObjects = Object.fromEntries(equipmentExampleEntries);
const equipmentExampleOrder = equipmentExampleEntries.map(([id]) => id);

export const footballBoardExample = createBoard({
  id: "football-example-board",
  version: 1,
  metadata: {
    name: "Football Example",
  },
  surface: {
    width: surfaceWidth,
    height: surfaceHeight,
    basePixelsPerUnit: 8,
    unit: "m",
    background: pitchColors.outer,
    markings: createFootballPitchMarkings(),
    markup: {
      sport: "football",
      variant: "full-pitch",
    },
  },
  objects: {
    byId: {
      ...playerExampleObjects,
      ...equipmentExampleObjects,
      ...arrowExampleObjects,
      ...shapeExampleObjects,
    },
    order: [
      ...playerExampleOrder,
      ...equipmentExampleOrder,
      ...arrowExampleOrder,
      ...shapeExampleOrder,
    ],
  },
  style: {},
});
