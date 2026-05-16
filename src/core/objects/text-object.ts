import type { BoardObject, Point } from "../board/types";
import { DEFAULT_PRESET_COLOR } from "../colors/preset-colors";

export const TEXT_OBJECT_TYPE = "text";
export const DEFAULT_TEXT_VALUE = "Text";
export const DEFAULT_TEXT_COLOR = DEFAULT_PRESET_COLOR.black;
export const DEFAULT_TEXT_FONT_SIZE = 14;
export const TEXT_FONT_FAMILY =
  '"Noto Sans", Helvetica, OpenSans, Arial, sans-serif';
export const TEXT_FONT_WEIGHT = 400;
export const TEXT_LINE_HEIGHT_RATIO = 20 / 14;
export const TEXT_CHARACTER_WIDTH_RATIO = 0.64;
export const TEXT_HORIZONTAL_PADDING_PX = 12;
export const TEXT_VERTICAL_PADDING_PX = 8;
export const MIN_TEXT_CONTENT_WIDTH_PX = 10;
export const DEFAULT_TEXT_REFERENCE_PIXELS_PER_UNIT = 10;

export type TextLineMetrics = {
  ascent: number;
  descent: number;
  glyphHeight: number;
  lineHeight: number;
  topInset: number;
};

export interface TextObjectProps extends Record<string, unknown> {
  text: string;
  color: string;
  fontSize: number;
  referencePixelsPerUnit: number;
  wrapWidth?: number;
}

export type TextObject = BoardObject & {
  type: typeof TEXT_OBJECT_TYPE;
  props: TextObjectProps;
};

type TextCoreInput = {
  position: Point;
  rotation?: number;
  text?: string;
  color?: string;
  fontSize?: number;
  referencePixelsPerUnit?: number;
  wrapWidth?: number;
};

function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y };
}

function normalizeRotation(rotation = 0) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function normalizeText(value: string | undefined) {
  return typeof value === "string" ? value : DEFAULT_TEXT_VALUE;
}

function normalizeFontSize(fontSize = DEFAULT_TEXT_FONT_SIZE) {
  return Math.min(144, Math.max(12, fontSize));
}

function normalizeWrapWidth(wrapWidth: number | undefined) {
  if (typeof wrapWidth !== "number" || Number.isNaN(wrapWidth)) {
    return undefined;
  }

  return Math.max(MIN_TEXT_CONTENT_WIDTH_PX, wrapWidth);
}

function normalizeReferencePixelsPerUnit(
  referencePixelsPerUnit = DEFAULT_TEXT_REFERENCE_PIXELS_PER_UNIT,
) {
  if (
    Number.isNaN(referencePixelsPerUnit) ||
    !Number.isFinite(referencePixelsPerUnit)
  ) {
    return 1;
  }

  return Math.max(referencePixelsPerUnit, 1e-9);
}

let textMeasureContext:
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D
  | null = null;

function getTextMeasureContext() {
  if (textMeasureContext) {
    return textMeasureContext;
  }

  if (typeof OffscreenCanvas !== "undefined") {
    textMeasureContext = new OffscreenCanvas(1, 1).getContext("2d");
    return textMeasureContext;
  }

  if (typeof document !== "undefined") {
    textMeasureContext = document.createElement("canvas").getContext("2d");
    return textMeasureContext;
  }

  return null;
}

function measureTextWidth(text: string, fontSize: number) {
  const context = getTextMeasureContext();

  if (!context) {
    const estimatedWidth = Array.from(text.length > 0 ? text : " ").reduce(
      (total, character) => {
        if ("ilI.,:;'|!".includes(character)) {
          return total + fontSize * 0.32;
        }

        if ("mwMW@%#&".includes(character)) {
          return total + fontSize * 0.9;
        }

        if (character === " ") {
          return total + fontSize * 0.35;
        }

        return total + fontSize * TEXT_CHARACTER_WIDTH_RATIO;
      },
      0,
    );

    return Math.max(MIN_TEXT_CONTENT_WIDTH_PX, estimatedWidth);
  }

  context.font = `${TEXT_FONT_WEIGHT} ${fontSize}px ${TEXT_FONT_FAMILY}`;

  return Math.max(
    MIN_TEXT_CONTENT_WIDTH_PX,
    context.measureText(text.length > 0 ? text : " ").width,
  );
}

export function getTextLineMetrics(fontSize: number): TextLineMetrics {
  const fallbackAscent = fontSize * 0.8;
  const fallbackDescent = fontSize * 0.2;
  const lineHeight = fontSize * TEXT_LINE_HEIGHT_RATIO;
  const context = getTextMeasureContext();

  if (!context) {
    const glyphHeight = fallbackAscent + fallbackDescent;

    return {
      ascent: fallbackAscent,
      descent: fallbackDescent,
      glyphHeight,
      lineHeight,
      topInset: (lineHeight - glyphHeight) / 2,
    };
  }

  context.font = `${TEXT_FONT_WEIGHT} ${fontSize}px ${TEXT_FONT_FAMILY}`;
  const metrics = context.measureText("Mg");
  const ascent =
    metrics.actualBoundingBoxAscent > 0
      ? metrics.actualBoundingBoxAscent
      : fallbackAscent;
  const descent =
    metrics.actualBoundingBoxDescent > 0
      ? metrics.actualBoundingBoxDescent
      : fallbackDescent;
  const glyphHeight = ascent + descent;

  return {
    ascent,
    descent,
    glyphHeight,
    lineHeight,
    topInset: (lineHeight - glyphHeight) / 2,
  };
}

function splitTokenToFitWidth(
  token: string,
  fontSize: number,
  maxWidth: number,
) {
  const chunks: string[] = [];
  let current = "";

  for (const character of token) {
    const candidate = `${current}${character}`;

    if (
      current.length > 0 &&
      measureTextWidth(candidate, fontSize) > maxWidth
    ) {
      chunks.push(current);
      current = character;
      continue;
    }

    current = candidate;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

export function getWrappedTextLines(
  text: string,
  fontSize: number,
  wrapWidth?: number,
) {
  const maxWidth = normalizeWrapWidth(wrapWidth);
  const sourceLines = text.split("\n");

  if (!maxWidth) {
    return sourceLines;
  }

  return sourceLines.flatMap((sourceLine) => {
    if (sourceLine.length === 0) {
      return [""];
    }

    const tokens = sourceLine.match(/\S+\s*|\s+/g) ?? [sourceLine];
    const wrappedLines: string[] = [];
    let currentLine = "";

    const pushCurrentLine = () => {
      wrappedLines.push(currentLine.trimEnd());
      currentLine = "";
    };

    for (const token of tokens) {
      const candidate = `${currentLine}${token}`;

      if (
        currentLine.length === 0 ||
        measureTextWidth(candidate, fontSize) <= maxWidth
      ) {
        currentLine = candidate;
        continue;
      }

      pushCurrentLine();
      const nextToken = token.trimStart();

      if (
        nextToken.length === 0 ||
        measureTextWidth(nextToken, fontSize) <= maxWidth
      ) {
        currentLine = nextToken;
        continue;
      }

      const tokenChunks = splitTokenToFitWidth(nextToken, fontSize, maxWidth);
      currentLine = tokenChunks.pop() ?? "";
      wrappedLines.push(...tokenChunks);
    }

    if (currentLine.length > 0 || wrappedLines.length === 0) {
      wrappedLines.push(currentLine.trimEnd());
    }

    return wrappedLines;
  });
}

export function getTextBoxSize(
  text: string,
  fontSize: number,
  wrapWidth?: number,
  referencePixelsPerUnit = DEFAULT_TEXT_REFERENCE_PIXELS_PER_UNIT,
) {
  const normalizedReferencePixelsPerUnit = normalizeReferencePixelsPerUnit(
    referencePixelsPerUnit,
  );
  const lines = getWrappedTextLines(text, fontSize, wrapWidth);
  const normalizedWrapWidth = normalizeWrapWidth(wrapWidth);
  const lineMetrics = getTextLineMetrics(fontSize);
  const contentWidth =
    normalizedWrapWidth ??
    Math.max(
      MIN_TEXT_CONTENT_WIDTH_PX,
      ...lines.map((line) => measureTextWidth(line, fontSize)),
    );

  return {
    width:
      (contentWidth + TEXT_HORIZONTAL_PADDING_PX) /
      normalizedReferencePixelsPerUnit,
    height:
      (lines.length * lineMetrics.lineHeight + TEXT_VERTICAL_PADDING_PX) /
      normalizedReferencePixelsPerUnit,
    mode: "world" as const,
  };
}

function getCanonicalTextProps(input: TextCoreInput): TextObjectProps {
  return {
    text: normalizeText(input.text),
    color: input.color ?? DEFAULT_TEXT_COLOR,
    fontSize: normalizeFontSize(input.fontSize),
    referencePixelsPerUnit: normalizeReferencePixelsPerUnit(
      input.referencePixelsPerUnit,
    ),
    wrapWidth: normalizeWrapWidth(input.wrapWidth),
  };
}

function createCanonicalTextObject(
  base: Omit<TextObject, "position" | "rotation" | "size" | "props">,
  input: TextCoreInput,
): TextObject {
  const props = getCanonicalTextProps(input);

  return {
    ...base,
    position: clonePoint(input.position),
    rotation: normalizeRotation(input.rotation),
    size: getTextBoxSize(
      props.text,
      props.fontSize,
      props.wrapWidth,
      props.referencePixelsPerUnit,
    ),
    props,
  };
}

export function createTextObject(
  input: {
    id: string;
  } & TextCoreInput,
): TextObject {
  return createCanonicalTextObject(
    {
      id: input.id,
      type: TEXT_OBJECT_TYPE,
    },
    input,
  );
}

export function updateTextObject(
  object: TextObject,
  input: Partial<TextCoreInput>,
): TextObject {
  return createCanonicalTextObject(
    {
      ...object,
      type: TEXT_OBJECT_TYPE,
    },
    {
      position: input.position ?? object.position,
      rotation: input.rotation ?? object.rotation,
      text: input.text ?? object.props.text,
      color: input.color ?? object.props.color,
      fontSize: input.fontSize ?? object.props.fontSize,
      referencePixelsPerUnit:
        input.referencePixelsPerUnit ?? object.props.referencePixelsPerUnit,
      wrapWidth: input.wrapWidth ?? object.props.wrapWidth,
    },
  );
}

export function isTextObjectEmpty(object: TextObject) {
  return object.props.text.trim().length === 0;
}
