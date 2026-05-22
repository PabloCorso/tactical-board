import { DEFAULT_PRESET_COLOR } from "../../core/colors/preset-colors";
import { createArrowObject } from "../../core/objects/arrow-object";
import { createEquipmentObject } from "../../core/objects/equipment-object";
import { createPlayerObject } from "../../core/objects/player-object";
import {
  createShapeObject,
  type ShapeFillStyle,
  type ShapeKind,
  type ShapeLineStyle,
} from "../../core/objects/shape-object";
import { createTextObject } from "../../core/objects/text-object";
import { FOOTBALL_EQUIPMENT_DEFINITIONS } from "../../react/football/equipment";
import {
  createFootballBoard,
  FOOTBALL_FULL_PITCH_METRICS,
} from "../../react/football/football-board";
import { FOOTBALL_PLAYER_PRESET_COLORS } from "../../react/football/football-catalog";
import { pointMetersToPixels } from "../../react/football/football-units";
import playerOneImage from "../../assets/player-1.png";

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
