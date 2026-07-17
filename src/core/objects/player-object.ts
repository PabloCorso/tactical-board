import type {
  Asset,
  BoardObject,
  BoardObjectSize,
  Point,
  PlayerCaption,
} from "../board/types";
import { DEFAULT_BOARD_COLOR } from "../colors/default-colors";

export const PLAYER_OBJECT_TYPE = "player";
export const DEFAULT_PLAYER_SIZE = 8 * 2.75;
export const DEFAULT_PLAYER_FONT_SIZE = 12;
export const DEFAULT_PLAYER_COLOR = DEFAULT_BOARD_COLOR.black;
export interface PlayerObjectProps extends Record<string, unknown> {
  groupId?: string;
  label?: string;
  color?: string;
  colors?: Record<string, string>;
  fontSize?: number;
  labelColor?: string;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaption;
  meta?: Record<string, unknown>;
}

export type PlayerObject = BoardObject & {
  type: typeof PLAYER_OBJECT_TYPE;
  props: PlayerObjectProps;
};

type PlayerCoreInput = {
  groupId?: string;
  position: Point;
  rotation?: number;
  size?: Partial<BoardObjectSize>;
  label?: string;
  color?: string;
  colors?: Record<string, string>;
  fontSize?: number;
  labelColor?: string;
  appearanceId?: string;
  options?: Record<string, unknown>;
  asset?: Asset;
  caption?: PlayerCaption;
  meta?: Record<string, unknown>;
};

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function normalizeRotation(rotation = 0) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizePlayerSize(
  size: Partial<BoardObjectSize> | undefined,
): BoardObjectSize {
  const rawWidth = size?.width ?? size?.height ?? DEFAULT_PLAYER_SIZE;
  const rawHeight = size?.height ?? size?.width ?? rawWidth;
  const dimension = Math.max(rawWidth, rawHeight, 2);

  return {
    width: dimension,
    height: dimension,
  };
}

function getInputValue<T extends object, K extends keyof T>(
  input: T,
  key: K,
  fallback: T[K],
) {
  return Object.prototype.hasOwnProperty.call(input, key)
    ? input[key]
    : fallback;
}

function getCanonicalPlayerProps(input: PlayerCoreInput): PlayerObjectProps {
  return {
    groupId: input.groupId,
    label: input.label,
    color: input.color,
    colors: input.colors ? { ...input.colors } : undefined,
    fontSize: input.fontSize,
    labelColor: input.labelColor,
    appearanceId: input.appearanceId,
    options: input.options ? { ...input.options } : undefined,
    asset: input.asset ? { ...input.asset } : undefined,
    caption: input.caption
      ? {
          text: input.caption.text,
          style: input.caption.style ? { ...input.caption.style } : undefined,
        }
      : undefined,
    meta: input.meta ? { ...input.meta } : undefined,
  };
}

function createCanonicalPlayerObject(
  base: Omit<PlayerObject, "position" | "rotation" | "size" | "props">,
  input: PlayerCoreInput,
): PlayerObject {
  return {
    ...base,
    position: clonePoint(input.position),
    rotation: normalizeRotation(input.rotation),
    size:
      input.size === undefined ? undefined : normalizePlayerSize(input.size),
    props: getCanonicalPlayerProps(input),
  };
}

export function createPlayerObject(
  input: {
    id: string;
  } & PlayerCoreInput,
): PlayerObject {
  return createCanonicalPlayerObject(
    {
      id: input.id,
      type: PLAYER_OBJECT_TYPE,
    },
    input,
  );
}

export function updatePlayerObject(
  object: PlayerObject,
  input: Partial<PlayerCoreInput>,
): PlayerObject {
  return createCanonicalPlayerObject(
    {
      ...object,
      type: PLAYER_OBJECT_TYPE,
    },
    {
      position: input.position ?? object.position,
      rotation: input.rotation ?? object.rotation,
      size: getInputValue(input, "size", object.size),
      groupId: getInputValue(input, "groupId", object.props.groupId),
      label: getInputValue(input, "label", object.props.label),
      color: getInputValue(input, "color", object.props.color),
      colors: getInputValue(input, "colors", object.props.colors),
      fontSize: getInputValue(input, "fontSize", object.props.fontSize),
      labelColor: getInputValue(input, "labelColor", object.props.labelColor),
      appearanceId: getInputValue(
        input,
        "appearanceId",
        object.props.appearanceId,
      ),
      options: getInputValue(input, "options", object.props.options),
      asset: getInputValue(input, "asset", object.props.asset),
      caption: getInputValue(input, "caption", object.props.caption),
      meta: getInputValue(input, "meta", object.props.meta),
    },
  );
}

export function resizePlayerObject(
  object: PlayerObject,
  nextSize: number,
): PlayerObject {
  return updatePlayerObject(object, {
    size: {
      ...object.size,
      width: nextSize,
      height: nextSize,
    },
  });
}

export function rotatePlayerObject(
  object: PlayerObject,
  rotation: number,
): PlayerObject {
  return updatePlayerObject(object, { rotation });
}
