import {
  getAbsoluteCanvasExtent,
  getContainedPlayerCircleGeometry,
  getPlayerLabelFontSize,
} from "../../../../core/rendering/canvas/object-render-scale";
import type { PlayerAppearanceRenderer } from "../../../../core/tools/player-appearance";
import { getContrastingPlayerLabelColor } from "../../../../core/tools/player-tool";
import type { PlayerObject } from "../../../../core/objects/player-object";
import {
  DEFAULT_PLAYER_COLOR,
  DEFAULT_PLAYER_FONT_SIZE,
} from "../../../../core/objects/player-object";
import type {
  BoardThemePlayerAppearanceDefinition,
  BoardThemePlayerPresetDefinition,
} from "../../../board/theme/board-theme";

export const FOOTBALL_SHIRT_APPEARANCE_ID = "football-shirt";
export const FOOTBALL_SECONDARY_COLOR_ROLE = "secondary";

export type FootballCirclePattern =
  | "solid"
  | "stripes"
  | "hoops"
  | "halves"
  | "sash";
export type FootballShirtPattern =
  | "solid"
  | "stripes"
  | "hoops"
  | "halves"
  | "sash";

const DEFAULT_SECONDARY_COLOR = "#ffffff";
type FootballShirtSvgPathCommand =
  | readonly ["M", number, number]
  | readonly ["C", number, number, number, number, number, number];

const FOOTBALL_SHIRT_OUTER_STROKE_WIDTH = 18;
// The source SVG uses a 1254 × 1254 viewbox, but the visible shirt only uses
// this region. Scaling the viewbox made that unused space behave like padding
// inside the player's configured size.
const FOOTBALL_SHIRT_VISIBLE_BOUNDS = {
  x: 72,
  y: 84,
  width: 1113,
  height: 1007,
} as const;
const FOOTBALL_SHIRT_VISIBLE_CENTER = {
  x: FOOTBALL_SHIRT_VISIBLE_BOUNDS.x + FOOTBALL_SHIRT_VISIBLE_BOUNDS.width / 2,
  y: FOOTBALL_SHIRT_VISIBLE_BOUNDS.y + FOOTBALL_SHIRT_VISIBLE_BOUNDS.height / 2,
} as const;

const FOOTBALL_SHIRT_BODY_PATH = [
  ["M", 940, 490],
  ["C", 941.727722, 492.0466, 942.110046, 494.233582, 940.484863, 496.489105],
  ["C", 939.252197, 498.199921, 939.507446, 500.114075, 939.50592, 502],
  ["C", 939.494812, 515.333313, 939.220093, 528.673706, 939.554565, 541.998657],
  ["C", 940.420532, 576.495972, 940.198669, 611.000854, 940.648132, 645.498047],
  ["C", 940.869629, 662.500305, 940.429749, 679.512573, 941.080078, 696.496948],
  ["C", 941.820496, 715.835571, 940.916809, 735.178284, 941.583069, 754.497131],
  ["C", 942.318909, 775.835693, 941.393921, 797.178284, 942.099915, 818.496704],
  ["C", 942.685242, 836.170959, 941.933716, 853.845276, 942.578125, 871.497131],
  ["C", 943.338867, 892.335205, 942.410095, 913.177673, 943.089111, 933.99707],
  ["C", 943.736145, 953.836365, 942.908264, 973.679199, 943.603271, 993.496399],
  [
    "C",
    944.188171,
    1010.171448,
    943.709534,
    1026.834717,
    944.006897,
    1043.499878,
  ],
  [
    "C",
    944.131897,
    1050.50061,
    944.441162,
    1057.499512,
    944.474304,
    1064.500122,
  ],
  ["C", 944.521973, 1074.564331, 937.511658, 1081.5, 927.5, 1081.5],
  ["C", 728.166687, 1081.5, 528.833313, 1081.5, 329.5, 1081.5],
  ["C", 319.464935, 1081.5, 312.5, 1074.535034, 312.5, 1064.5],
  ["C", 312.5, 1056.666626, 312.461823, 1048.83313, 312.506989, 1041],
  ["C", 312.654999, 1015.333252, 312.471313, 989.657593, 313.117279, 964.00293],
  ["C", 313.61261, 944.329224, 312.912079, 924.654968, 313.593658, 905.003235],
  ["C", 314.195038, 887.662903, 313.430054, 870.320435, 314.085602, 853.003235],
  ["C", 314.805084, 833.997131, 313.914001, 814.98822, 314.585693, 796.003052],
  ["C", 315.258087, 776.99707, 314.415558, 757.98761, 315.094208, 739.003357],
  ["C", 315.725983, 721.329468, 314.924072, 703.654053, 315.592255, 686.003479],
  ["C", 316.185638, 670.329407, 315.461975, 654.654175, 316.074677, 639.00293],
  ["C", 316.864319, 618.831909, 315.913788, 598.655518, 316.59491, 578.503235],
  ["C", 317.147217, 562.162781, 316.486328, 545.821777, 317.11264, 529.504333],
  ["C", 317.458405, 520.495178, 317.273865, 511.498657, 317.516693, 502.500458],
  ["C", 317.594452, 499.618164, 317.335754, 496.87439, 315.5, 494.5],
] as const satisfies readonly FootballShirtSvgPathCommand[];

const FOOTBALL_SHIRT_TOP_PATH = [
  ["M", 942, 494],
  ["C", 944.565796, 494.135284, 946.616577, 495.181915, 948.528564, 496.969452],
  [
    "C",
    970.150208,
    517.184265,
    991.838867,
    537.327454,
    1013.496277,
    557.503967,
  ],
  [
    "C",
    1019.295715,
    562.90686,
    1023.721436,
    562.828857,
    1029.515747,
    557.517151,
  ],
  [
    "C",
    1056.647095,
    532.645264,
    1083.876587,
    507.880493,
    1110.982788,
    482.981232,
  ],
  [
    "C",
    1125.746094,
    469.41983,
    1140.186035,
    455.503143,
    1155.077393,
    442.085846,
  ],
  [
    "C",
    1160.510742,
    437.190308,
    1165.44458,
    431.729919,
    1171.461426,
    427.445862,
  ],
  [
    "C",
    1175.346924,
    424.679413,
    1175.678833,
    417.580963,
    1172.498535,
    413.501129,
  ],
  [
    "C",
    1158.335449,
    395.331726,
    1144.141235,
    377.186401,
    1130.005737,
    358.995514,
  ],
  [
    "C",
    1107.484009,
    330.01239,
    1085.043945,
    300.965759,
    1062.487183,
    272.009949,
  ],
  [
    "C",
    1041.547363,
    245.129745,
    1020.776306,
    218.110504,
    999.389282,
    191.589264,
  ],
  ["C", 987.819092, 177.241455, 972.479614, 168.35939, 954.539795, 163.357239],
  ["C", 931.542603, 156.944931, 908.731018, 149.814255, 886.025208, 142.422638],
  ["C", 855.756592, 132.569077, 825.750793, 121.90551, 795.453308, 112.144875],
  ["C", 785.165955, 108.830696, 775.606262, 104.109772, 766.075012, 99.349792],
  ["C", 757.061646, 94.848419, 748.13385, 93.889618, 739.032715, 97.580673],
  ["C", 720.953247, 104.912949, 702.050781, 109.219383, 682.969055, 112.309036],
  ["C", 661.351562, 115.80928, 639.452087, 117.077751, 617.499878, 116.505295],
  ["C", 581.566711, 115.56823, 546.783325, 108.53318, 513.038635, 96.392677],
  ["C", 505.703766, 93.753777, 499.145142, 95.454132, 493.063538, 98.621971],
  ["C", 471.868744, 109.662079, 448.924835, 115.819702, 426.547028, 123.634682],
  ["C", 404.598206, 131.299866, 382.570435, 138.72139, 360.469055, 145.904739],
  ["C", 341.117371, 152.194427, 321.56189, 157.884842, 301.983063, 163.440323],
  ["C", 281.275848, 169.315979, 265.506744, 181.277039, 252.266846, 198.318863],
  ["C", 233.778976, 222.115601, 215.252457, 245.900635, 196.562485, 269.549377],
  ["C", 175.789551, 295.833679, 155.539047, 322.530334, 134.987686, 348.990448],
  ["C", 118.381683, 370.37088, 101.656357, 391.6586, 85.007912, 413.006165],
  ["C", 81.287941, 417.776154, 81.276398, 422.845032, 85.548691, 426.94931],
  ["C", 93.882645, 434.955475, 102.493065, 442.674225, 111.00174, 450.498108],
  ["C", 121.160881, 459.83963, 131.346893, 469.151947, 141.497269, 478.50296],
  ["C", 165.005844, 500.160309, 188.492538, 521.841431, 212.005692, 543.493835],
  ["C", 217.300201, 548.369324, 222.715546, 553.114136, 227.985352, 558.015747],
  ["C", 232.660568, 562.364258, 235.798096, 562.529358, 241.024841, 559.03717],
  ["C", 247.58551, 554.653748, 252.563568, 548.544128, 258.372498, 543.357178],
  ["C", 274.902374, 528.59729, 290.842377, 513.176331, 306.988647, 497.987915],
  ["C", 309.02301, 496.074249, 310.920013, 494.071808, 313.999603, 493.985352],
  ["C", 316.587524, 493.912659, 315.4729, 490.938019, 317, 490],
] as const satisfies readonly FootballShirtSvgPathCommand[];

const FOOTBALL_SHIRT_NECK_PATH = [
  ["M", 787, 111],
  ["C", 783.230347, 115.073166, 785.013367, 120.405396, 784.253174, 125.041512],
  ["C", 781.792847, 140.04715, 777.173218, 154.243027, 769.880249, 167.433792],
  ["C", 764.111206, 177.868256, 756.888672, 187.557327, 748.394897, 195.892883],
  ["C", 729.931946, 214.011841, 708.295471, 227.227051, 683.497009, 234.990448],
  ["C", 668.198975, 239.779663, 652.620361, 242.575851, 636.506775, 243.181046],
  ["C", 624.756775, 243.62233, 612.996582, 243.607224, 601.534607, 241.78273],
  ["C", 579.038025, 238.201797, 557.680359, 230.840485, 537.984314, 219.026184],
  ["C", 511.083221, 202.890152, 491.222015, 180.687027, 479.559204, 151.476364],
  ["C", 475.159088, 140.455811, 472.259338, 128.96608, 472.090759, 116.998718],
  ["C", 472.058563, 114.713562, 470.185394, 113.508347, 470, 111.5],
] as const satisfies readonly FootballShirtSvgPathCommand[];

const FOOTBALL_SHIRT_COLLAR_PATH = [
  ["M", 504, 96.5],
  ["C", 504.612091, 106.37278, 504.657959, 116.373962, 507.092926, 125.976433],
  ["C", 512.927856, 148.986694, 525.610474, 167.500137, 544.447876, 182.067383],
  ["C", 562.161743, 195.765717, 582.272156, 204.272446, 604.037781, 207.221085],
  ["C", 640.801453, 212.201553, 676.142822, 207.304657, 707.465454, 185.4505],
  ["C", 727.572937, 171.42131, 741.884155, 152.989685, 748.546936, 129.013046],
  ["C", 750.96637, 120.306595, 752.149597, 111.483498, 752.512573, 102.500511],
  ["C", 752.593506, 100.497047, 752.833313, 98.5, 753, 96.5],
] as const satisfies readonly FootballShirtSvgPathCommand[];

function drawFootballShirtSvgPath(
  context: CanvasRenderingContext2D,
  commands: readonly FootballShirtSvgPathCommand[],
  scale: number,
  options: { beginPath?: boolean } = {},
) {
  const x = (value: number) =>
    (value - FOOTBALL_SHIRT_VISIBLE_CENTER.x) * scale;
  const y = (value: number) =>
    (value - FOOTBALL_SHIRT_VISIBLE_CENTER.y) * scale;

  if (options.beginPath !== false) {
    context.beginPath();
  }

  for (const command of commands) {
    if (command[0] === "M") {
      context.moveTo(x(command[1]), y(command[2]));
    } else {
      context.bezierCurveTo(
        x(command[1]),
        y(command[2]),
        x(command[3]),
        y(command[4]),
        x(command[5]),
        y(command[6]),
      );
    }
  }
}

function strokeFootballShirtSvgPath({
  commands,
  context,
  scale,
  strokeWidth,
}: {
  commands: readonly FootballShirtSvgPathCommand[];
  context: CanvasRenderingContext2D;
  scale: number;
  strokeWidth: number;
}) {
  drawFootballShirtSvgPath(context, commands, scale);
  context.lineWidth = strokeWidth * scale;
  context.stroke();
}

function appendReversedFootballShirtSvgPath(
  context: CanvasRenderingContext2D,
  commands: readonly FootballShirtSvgPathCommand[],
  scale: number,
) {
  const x = (value: number) =>
    (value - FOOTBALL_SHIRT_VISIBLE_CENTER.x) * scale;
  const y = (value: number) =>
    (value - FOOTBALL_SHIRT_VISIBLE_CENTER.y) * scale;

  for (let index = commands.length - 1; index > 0; index -= 1) {
    const command = commands[index];
    const previous = commands[index - 1];

    if (command[0] !== "C") {
      continue;
    }

    const previousX = previous[0] === "M" ? previous[1] : previous[5];
    const previousY = previous[0] === "M" ? previous[2] : previous[6];

    context.bezierCurveTo(
      x(command[3]),
      y(command[4]),
      x(command[1]),
      y(command[2]),
      x(previousX),
      y(previousY),
    );
  }
}

function buildFootballShirtShapePath(
  context: CanvasRenderingContext2D,
  scale: number,
) {
  context.beginPath();
  drawFootballShirtSvgPath(context, FOOTBALL_SHIRT_TOP_PATH, scale, {
    beginPath: false,
  });
  appendReversedFootballShirtSvgPath(context, FOOTBALL_SHIRT_BODY_PATH, scale);
  context.closePath();
}

function fillViewBoxRect(
  context: CanvasRenderingContext2D,
  scale: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillRect(
    (x - FOOTBALL_SHIRT_VISIBLE_CENTER.x) * scale,
    (y - FOOTBALL_SHIRT_VISIBLE_CENTER.y) * scale,
    width * scale,
    height * scale,
  );
}

function getFootballShirtPattern(player: PlayerObject): FootballShirtPattern {
  const pattern = player.props.options?.pattern;

  switch (pattern) {
    case "stripes":
    case "hoops":
    case "halves":
    case "sash":
      return pattern;
    default:
      return "solid";
  }
}

function getFootballCirclePattern(player: PlayerObject): FootballCirclePattern {
  const pattern = player.props.options?.pattern;

  switch (pattern) {
    case "stripes":
    case "hoops":
    case "halves":
    case "sash":
      return pattern;
    default:
      return "solid";
  }
}

function drawFootballShirtPattern({
  context,
  pattern,
  patternColor,
  scale,
}: {
  context: CanvasRenderingContext2D;
  pattern: FootballShirtPattern;
  patternColor: string;
  scale: number;
}) {
  if (pattern === "solid") {
    return;
  }

  context.save();
  buildFootballShirtShapePath(context, scale);
  context.clip();
  context.fillStyle = patternColor;

  if (pattern === "stripes") {
    drawCenteredFootballShirtBands({
      context,
      scale,
      direction: "vertical",
    });
  } else if (pattern === "hoops") {
    drawCenteredFootballShirtBands({
      context,
      scale,
      direction: "horizontal",
    });
  } else if (pattern === "halves") {
    fillViewBoxRect(
      context,
      scale,
      FOOTBALL_SHIRT_VISIBLE_CENTER.x,
      60,
      600,
      1140,
    );
  } else if (pattern === "sash") {
    context.rotate(Math.PI / 4);
    context.fillRect(-90 * scale, -1200 * scale, 180 * scale, 2400 * scale);
  }

  context.restore();
}

function drawCenteredFootballShirtBands({
  context,
  direction,
  scale,
}: {
  context: CanvasRenderingContext2D;
  direction: "horizontal" | "vertical";
  scale: number;
}) {
  const bandWidth = 105;
  const bandStep = bandWidth * 2;
  const center =
    direction === "vertical"
      ? FOOTBALL_SHIRT_VISIBLE_CENTER.x
      : FOOTBALL_SHIRT_VISIBLE_CENTER.y;
  const halfExtent =
    (direction === "vertical"
      ? FOOTBALL_SHIRT_VISIBLE_BOUNDS.width
      : FOOTBALL_SHIRT_VISIBLE_BOUNDS.height) / 2;
  const outerBandIndex = Math.floor((halfExtent + bandWidth / 2) / bandStep);

  for (let index = -outerBandIndex; index <= outerBandIndex; index += 1) {
    const offset = index * bandStep - bandWidth / 2;

    if (direction === "vertical") {
      fillViewBoxRect(
        context,
        scale,
        center + offset,
        FOOTBALL_SHIRT_VISIBLE_BOUNDS.y,
        bandWidth,
        FOOTBALL_SHIRT_VISIBLE_BOUNDS.height,
      );
    } else {
      fillViewBoxRect(
        context,
        scale,
        FOOTBALL_SHIRT_VISIBLE_BOUNDS.x,
        center + offset,
        FOOTBALL_SHIRT_VISIBLE_BOUNDS.width,
        bandWidth,
      );
    }
  }
}

function drawFootballCirclePattern({
  context,
  pattern,
  patternColor,
  radius,
}: {
  context: CanvasRenderingContext2D;
  pattern: FootballCirclePattern;
  patternColor: string;
  radius: number;
}) {
  if (pattern === "solid") {
    return;
  }

  context.save();
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = patternColor;

  if (pattern === "stripes") {
    const stripeWidth = radius * 0.44;
    const outerStripeIndex = Math.floor(
      (radius + stripeWidth / 2) / (stripeWidth * 2),
    );

    for (let index = -outerStripeIndex; index <= outerStripeIndex; index += 1) {
      const x = index * stripeWidth * 2 - stripeWidth / 2;
      context.fillRect(x, -radius, stripeWidth, radius * 2);
    }
  } else if (pattern === "hoops") {
    const stripeHeight = radius * 0.44;
    const outerStripeIndex = Math.floor(
      (radius + stripeHeight / 2) / (stripeHeight * 2),
    );

    for (let index = -outerStripeIndex; index <= outerStripeIndex; index += 1) {
      const y = index * stripeHeight * 2 - stripeHeight / 2;
      context.fillRect(-radius, y, radius * 2, stripeHeight);
    }
  } else if (pattern === "halves") {
    context.fillRect(0, -radius, radius, radius * 2);
  } else if (pattern === "sash") {
    context.rotate(Math.PI / 4);
    context.fillRect(-radius * 0.22, -radius * 2, radius * 0.44, radius * 4);
  }

  context.restore();
}

function drawPlayerMarkerLabel({
  color,
  context,
  fontSize,
  offsetY = 0,
  player,
}: {
  color: string;
  context: CanvasRenderingContext2D;
  fontSize: number;
  offsetY?: number;
  player: PlayerObject;
}) {
  if (!player.props.label) {
    return;
  }

  context.fillStyle = color;
  context.font = `700 ${fontSize}px "ui-rounded", "SF Pro Display", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(player.props.label), 0, offsetY);
}

function getMarkerLabelFontSize(
  player: PlayerObject,
  radius: number,
  frameScale: number,
) {
  return Math.max(
    (player.props.fontSize ?? DEFAULT_PLAYER_FONT_SIZE) * frameScale,
    getPlayerLabelFontSize(radius),
  );
}

function getFootballSecondaryColor(player: PlayerObject) {
  return (
    player.props.colors?.[FOOTBALL_SECONDARY_COLOR_ROLE] ??
    DEFAULT_SECONDARY_COLOR
  );
}

function getAutomaticMarkerLabelColor(
  player: PlayerObject,
  backgroundColor: string,
) {
  return (
    player.props.labelColor ?? getContrastingPlayerLabelColor(backgroundColor)
  );
}

export const FOOTBALL_PLAYER_APPEARANCES: BoardThemePlayerAppearanceDefinition[] =
  [
    {
      id: "circle",
      label: "Circle",
      colors: [
        {
          id: FOOTBALL_SECONDARY_COLOR_ROLE,
          label: "Secondary color",
          defaultValue: DEFAULT_SECONDARY_COLOR,
          visibleWhen: {
            optionId: "pattern",
            values: ["stripes", "hoops", "halves", "sash"],
          },
        },
      ],
      options: [
        {
          id: "pattern",
          label: "Pattern",
          defaultValue: "solid",
          choices: [
            { value: "solid", label: "Solid" },
            { value: "stripes", label: "Stripes" },
            { value: "hoops", label: "Hoops" },
            { value: "halves", label: "Halves" },
            { value: "sash", label: "Sash" },
          ],
        },
      ],
      defaultProps: {
        colors: {
          [FOOTBALL_SECONDARY_COLOR_ROLE]: DEFAULT_SECONDARY_COLOR,
        },
        options: {
          pattern: "solid",
        },
      },
    },
    {
      id: FOOTBALL_SHIRT_APPEARANCE_ID,
      label: "Shirt",
      colors: [
        {
          id: FOOTBALL_SECONDARY_COLOR_ROLE,
          label: "Secondary color",
          defaultValue: DEFAULT_SECONDARY_COLOR,
          visibleWhen: {
            optionId: "pattern",
            values: ["stripes", "hoops", "halves", "sash"],
          },
        },
      ],
      options: [
        {
          id: "pattern",
          label: "Pattern",
          defaultValue: "solid",
          choices: [
            { value: "solid", label: "Solid" },
            { value: "stripes", label: "Stripes" },
            { value: "hoops", label: "Hoops" },
            { value: "halves", label: "Halves" },
            { value: "sash", label: "Sash" },
          ],
        },
      ],
      defaultProps: {
        colors: {
          [FOOTBALL_SECONDARY_COLOR_ROLE]: DEFAULT_SECONDARY_COLOR,
        },
        options: {
          pattern: "solid",
        },
      },
    },
    {
      id: "image",
      label: "Image",
    },
  ];

export const FOOTBALL_PLAYER_PRESETS: BoardThemePlayerPresetDefinition[] = [
  {
    id: "circle",
    label: "Circle",
    appearanceId: "circle",
  },
  {
    id: "shirt",
    label: "Shirt",
    appearanceId: FOOTBALL_SHIRT_APPEARANCE_ID,
    options: { pattern: "solid" },
  },
  {
    id: "shirt-stripes",
    label: "Stripes",
    appearanceId: FOOTBALL_SHIRT_APPEARANCE_ID,
    colors: { [FOOTBALL_SECONDARY_COLOR_ROLE]: DEFAULT_SECONDARY_COLOR },
    options: { pattern: "stripes" },
  },
  {
    id: "shirt-hoops",
    label: "Hoops",
    appearanceId: FOOTBALL_SHIRT_APPEARANCE_ID,
    colors: { [FOOTBALL_SECONDARY_COLOR_ROLE]: DEFAULT_SECONDARY_COLOR },
    options: { pattern: "hoops" },
  },
  {
    id: "shirt-halves",
    label: "Halves",
    appearanceId: FOOTBALL_SHIRT_APPEARANCE_ID,
    colors: { [FOOTBALL_SECONDARY_COLOR_ROLE]: DEFAULT_SECONDARY_COLOR },
    options: { pattern: "halves" },
  },
  {
    id: "shirt-sash",
    label: "Sash",
    appearanceId: FOOTBALL_SHIRT_APPEARANCE_ID,
    colors: { [FOOTBALL_SECONDARY_COLOR_ROLE]: DEFAULT_SECONDARY_COLOR },
    options: { pattern: "sash" },
  },
];

export const renderFootballShirtPlayerAppearance: PlayerAppearanceRenderer = ({
  appearance,
  context,
  frameTransform,
  player,
}) => {
  const bounds = frameTransform.getObjectCanvasBounds(player);
  const width = getAbsoluteCanvasExtent(bounds.width);
  const height = getAbsoluteCanvasExtent(bounds.height);
  const scaleX =
    width /
    (FOOTBALL_SHIRT_VISIBLE_BOUNDS.width + FOOTBALL_SHIRT_OUTER_STROKE_WIDTH);
  const scaleY =
    height /
    (FOOTBALL_SHIRT_VISIBLE_BOUNDS.height + FOOTBALL_SHIRT_OUTER_STROKE_WIDTH);
  const shirtColor =
    player.props.colors?.shirt ??
    player.props.colors?.primary ??
    player.props.color ??
    DEFAULT_PLAYER_COLOR;

  context.save();
  context.globalAlpha = appearance === "preview" ? 0.55 : 1;
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((player.rotation ?? 0) * Math.PI) / 180);
  context.save();
  context.scale(scaleX, scaleY);
  context.fillStyle = shirtColor;
  buildFootballShirtShapePath(context, 1);
  context.fill();
  drawFootballShirtPattern({
    context,
    pattern: getFootballShirtPattern(player),
    patternColor: getFootballSecondaryColor(player),
    scale: 1,
  });
  context.strokeStyle = "#000000";
  context.lineCap = "round";
  context.lineJoin = "round";
  strokeFootballShirtSvgPath({
    commands: FOOTBALL_SHIRT_BODY_PATH,
    context,
    scale: 1,
    strokeWidth: FOOTBALL_SHIRT_OUTER_STROKE_WIDTH,
  });
  strokeFootballShirtSvgPath({
    commands: FOOTBALL_SHIRT_TOP_PATH,
    context,
    scale: 1,
    strokeWidth: FOOTBALL_SHIRT_OUTER_STROKE_WIDTH,
  });
  strokeFootballShirtSvgPath({
    commands: FOOTBALL_SHIRT_NECK_PATH,
    context,
    scale: 1,
    strokeWidth: 5,
  });
  strokeFootballShirtSvgPath({
    commands: FOOTBALL_SHIRT_COLLAR_PATH,
    context,
    scale: 1,
    strokeWidth: 9,
  });
  context.restore();

  const labelFontSize = getMarkerLabelFontSize(
    player,
    Math.min(width, height) / 2,
    frameTransform.scale,
  );

  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = 2;
  drawPlayerMarkerLabel({
    color: getAutomaticMarkerLabelColor(
      player,
      getFootballShirtPattern(player) === "solid"
        ? shirtColor
        : getFootballSecondaryColor(player),
    ),
    context,
    fontSize: labelFontSize,
    offsetY: height * 0.11,
    player,
  });

  context.restore();
};

export const renderFootballCirclePlayerAppearance: PlayerAppearanceRenderer = ({
  appearance,
  context,
  frameTransform,
  player,
}) => {
  const bounds = frameTransform.getObjectCanvasBounds(player);
  const width = getAbsoluteCanvasExtent(bounds.width);
  const height = getAbsoluteCanvasExtent(bounds.height);
  const outerRadius = Math.min(width, height) / 2;
  const { borderWidth, radius } = getContainedPlayerCircleGeometry(outerRadius);
  const fillColor = player.props.color ?? DEFAULT_PLAYER_COLOR;

  context.save();
  context.globalAlpha = appearance === "preview" ? 0.55 : 1;
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((player.rotation ?? 0) * Math.PI) / 180);

  context.fillStyle = fillColor;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();

  drawFootballCirclePattern({
    context,
    pattern: getFootballCirclePattern(player),
    patternColor: getFootballSecondaryColor(player),
    radius,
  });

  context.strokeStyle = "#000000";
  context.lineWidth = borderWidth;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.stroke();

  drawPlayerMarkerLabel({
    color: getAutomaticMarkerLabelColor(
      player,
      getFootballCirclePattern(player) === "solid"
        ? fillColor
        : getFootballSecondaryColor(player),
    ),
    context,
    fontSize: getMarkerLabelFontSize(player, radius, frameTransform.scale),
    offsetY: 1,
    player,
  });

  context.restore();
};

export const FOOTBALL_PLAYER_APPEARANCE_RENDERERS = {
  circle: renderFootballCirclePlayerAppearance,
  [FOOTBALL_SHIRT_APPEARANCE_ID]: renderFootballShirtPlayerAppearance,
} satisfies Record<string, PlayerAppearanceRenderer>;
