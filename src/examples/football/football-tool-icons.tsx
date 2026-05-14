import { useCallback, useMemo } from "react";
import type { BoardEditorState } from "../../core/editor/types";
import { DEFAULT_RENDER_APPEARANCE } from "../../core/objects/object-appearance";
import type { EquipmentDefinition } from "../../core/objects/equipment-object";
import { PLAYER_OBJECT_TYPE } from "../../core/objects/player-object";
import {
  createArrowObject,
  getArrowCenter,
  getArrowSize,
  type ArrowObject,
} from "../../core/objects/arrow-object";
import type { EquipmentObject } from "../../core/objects/equipment-object";
import type { BoardSpaceProjection } from "../../core/geometry/board-space-projection";
import { useBoardEditorContext } from "../../react/components/board-editor-context";
import { useBoardEditorStore } from "../../react/hooks/use-board-editor-store";
import { getArrowToolState, type ArrowDraftStyle } from "../../tools/arrow-tool-state";
import { getEquipmentToolState } from "../../tools/equipment-tool-state";
import { getPlayerToolState, PLAYER_TOOL_ID } from "../../tools/player-tool-state";
import { getShapeToolState } from "../../tools/shape-tool-state";
import { renderArrow } from "../../tools/arrow-tool";
import {
  FOOTBALL_EQUIPMENT_DEFINITIONS,
  FOOTBALL_EQUIPMENT_RENDERERS,
} from "./equipment";
import { FOOTBALL_PLAYER_PRESET_COLORS } from "./football-example-catalog";

const TOOL_ICON_SIZE_PX = 24;

function getContrastingTextColor(color: string) {
  const normalized = color.trim().replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized;

  if (!/^[\da-f]{6}$/i.test(expanded)) {
    return "#ffffff";
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 160 ? "#111827" : "#ffffff";
}

function parseNumericLabel(label: unknown) {
  if (typeof label !== "string" || label.trim() === "") {
    return undefined;
  }

  const value = Number.parseInt(label, 10);

  if (!Number.isFinite(value) || String(value) !== label.trim()) {
    return undefined;
  }

  return value;
}

function getCurrentPlayerLabel(
  state: Pick<BoardEditorState, "toolState" | "board">,
  color: string,
) {
  const playerState = getPlayerToolState(state.toolState);
  const colorKey = color.trim().toLowerCase();
  const nextLabelFromState = playerState.nextNumericLabelByColor[colorKey] ?? 1;
  const nextLabelFromBoard =
    Math.max(
      0,
      ...Object.values(state.board.objects.byId)
        .filter(
          (object) =>
            object.type === PLAYER_OBJECT_TYPE &&
            typeof object.props.color === "string" &&
            object.props.color.trim().toLowerCase() === colorKey,
        )
        .map((object) => parseNumericLabel(object.props.label))
        .filter((value): value is number => typeof value === "number"),
    ) + 1;

  return String(Math.max(nextLabelFromState, nextLabelFromBoard));
}

export function FootballArrowPresetIcon({
  draftStyle,
  className = "h-5 w-10",
  width = 40,
  height = 20,
}: {
  draftStyle: Pick<
    ArrowDraftStyle,
    | "geometry"
    | "bodyStyle"
    | "color"
    | "strokeWidth"
    | "lineStyle"
    | "dashStyle"
    | "startHead"
    | "endHead"
  >;
  className?: string;
  width?: number;
  height?: number;
}) {
  const previewArrow = useMemo(() => createArrowIconPreviewObject(draftStyle), [
    draftStyle,
  ]);
  const drawCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const ratio =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(ratio, ratio);
    renderArrow({
      context,
      object: previewArrow,
      appearance: "default",
      requestRender: () => {},
      surfaceTransform: createArrowIconProjection(previewArrow, width, height),
    });
  }, [height, previewArrow, width]);

  return (
    <canvas
      aria-hidden="true"
      className={className}
      ref={drawCanvas}
      style={{ width, height }}
    />
  );
}

export function FootballShapePresetIcon({
  kind,
  color,
  fillOpacity,
  className = "h-5 w-10",
}: {
  kind: "rectangle" | "oval" | "triangle" | "diamond" | "polygon";
  color: string;
  fillOpacity: number;
  className?: string;
}) {
  return (
    <span className="flex h-5 w-full items-center justify-center">
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        viewBox="0 0 40 20"
      >
        {kind === "oval" ? (
          <ellipse
            cx="20"
            cy="10"
            rx="11"
            ry="6"
            fill={color}
            fillOpacity={fillOpacity}
            stroke={color}
            strokeWidth="2.25"
          />
        ) : kind === "triangle" ? (
          <path
            d="M20 4 L31 16 L9 16 Z"
            fill={color}
            fillOpacity={fillOpacity}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        ) : kind === "diamond" ? (
          <path
            d="M20 4 L31 10 L20 16 L9 10 Z"
            fill={color}
            fillOpacity={fillOpacity}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        ) : kind === "polygon" ? (
          <path
            d="M10 13 L15 5 L28 6 L31 14 L18 16 Z"
            fill={color}
            fillOpacity={fillOpacity}
            stroke={color}
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        ) : (
          <rect
            x="9"
            y="4"
            width="22"
            height="12"
            rx="2"
            fill={color}
            fillOpacity={fillOpacity}
            stroke={color}
            strokeWidth="2.25"
          />
        )}
      </svg>
    </span>
  );
}

export function FootballPlayerToolIcon() {
  const store = useBoardEditorContext();
  const color = useBoardEditorStore(store, (state) => {
    const rawState = state.toolState[PLAYER_TOOL_ID];

    return rawState
      ? getPlayerToolState(state.toolState).draftStyle.color
      : (FOOTBALL_PLAYER_PRESET_COLORS[0] ?? "#111827");
  });
  const toolState = useBoardEditorStore(store, (state) => state.toolState);
  const board = useBoardEditorStore(store, (state) => state.board);
  const label = useMemo(
    () => getCurrentPlayerLabel({ toolState, board }, color),
    [board, color, toolState],
  );

  return (
    <span
      className="border-default inline-flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold"
      style={{ backgroundColor: color }}
    >
      <span
        className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
        style={{ color: getContrastingTextColor(color) }}
      >
        {label}
      </span>
    </span>
  );
}

export function FootballArrowToolIcon() {
  const store = useBoardEditorContext();
  const toolState = useBoardEditorStore(
    store,
    (state) => state.toolState,
  );
  const draftStyle = useMemo(
    () => getArrowToolState(toolState).draftStyle,
    [toolState],
  );

  return (
    <FootballArrowPresetIcon
      draftStyle={draftStyle}
      className="h-5 w-5"
      width={20}
      height={20}
    />
  );
}

function createArrowIconPreviewObject(
  draftStyle: Pick<
    ArrowDraftStyle,
    | "geometry"
    | "bodyStyle"
    | "color"
    | "strokeWidth"
    | "lineStyle"
    | "dashStyle"
    | "startHead"
    | "endHead"
  >,
): ArrowObject {
  return draftStyle.geometry === "polyline"
    ? createArrowObject({
        id: "arrow-icon-preview",
        points: [
          { x: 0.8, y: 3.2 },
          { x: 3.2, y: 1.25 },
          { x: 5.25, y: 2.55 },
          { x: 7.1, y: 0.95 },
        ],
        ...draftStyle,
      })
    : createArrowObject({
        id: "arrow-icon-preview",
        start: { x: 0.9, y: 2 },
        end: { x: 7.1, y: 2 },
        ...draftStyle,
      });
}

function createArrowIconProjection(
  arrow: ArrowObject,
  width: number,
  height: number,
): BoardSpaceProjection {
  const bounds = getArrowSize(arrow.props);
  const center = getArrowCenter(arrow.props);
  const left = center.x - bounds.width / 2;
  const top = center.y - bounds.height / 2;
  const scale = Math.min(width / bounds.width, height / bounds.height);
  const offsetX = (width - bounds.width * scale) / 2;
  const offsetY = (height - bounds.height * scale) / 2;

  const worldToCanvas = (point: { x: number; y: number }) => ({
    x: (point.x - left) * scale + offsetX,
    y: (point.y - top) * scale + offsetY,
  });

  return {
    frame: { x: 0, y: 0, width, height },
    zoom: scale,
    pixelsPerUnit: scale,
    worldOrigin: { x: left, y: top },
    worldToCanvas,
    canvasToWorld: (point) => ({
      x: (point.x - offsetX) / scale + left,
      y: (point.y - offsetY) / scale + top,
    }),
    getObjectCanvasRadius: (object) => ((object.size?.width ?? 0) * scale) / 2,
    getObjectCanvasBounds: (object) => {
      const canvasCenter = worldToCanvas(object.position);
      const objectWidth = (object.size?.width ?? 0) * scale;
      const objectHeight =
        (object.size?.height ?? object.size?.width ?? 0) * scale;

      return {
        x: canvasCenter.x - objectWidth / 2,
        y: canvasCenter.y - objectHeight / 2,
        width: objectWidth,
        height: objectHeight,
      };
    },
    hitTestObject: () => false,
  };
}

export function FootballShapeToolIcon() {
  const store = useBoardEditorContext();
  const rawKind = useBoardEditorStore(
    store,
    (state) => getShapeToolState(state.toolState).draftStyle.kind,
  );
  const color = useBoardEditorStore(
    store,
    (state) => getShapeToolState(state.toolState).draftStyle.color,
  );
  const fillStyle = useBoardEditorStore(
    store,
    (state) => getShapeToolState(state.toolState).draftStyle.fillStyle,
  );
  const fillOpacity = useBoardEditorStore(
    store,
    (state) => getShapeToolState(state.toolState).draftStyle.fillOpacity,
  );

  const kind =
    rawKind === "oval" ||
    rawKind === "triangle" ||
    rawKind === "diamond" ||
    rawKind === "polygon"
      ? rawKind
      : "rectangle";

  return (
    <FootballShapePresetIcon
      kind={kind}
      color={color}
      fillOpacity={fillStyle === "none" ? 0 : fillOpacity}
      className="h-5 w-5 overflow-visible"
    />
  );
}

export function FootballEquipmentToolIcon() {
  const store = useBoardEditorContext();
  const kind = useBoardEditorStore(
    store,
    (state) => getEquipmentToolState(state.toolState).draftStyle.kind,
  );
  const definition = useMemo(
    () =>
      FOOTBALL_EQUIPMENT_DEFINITIONS.find((item) => item.kind === kind) ??
      FOOTBALL_EQUIPMENT_DEFINITIONS[0],
    [kind],
  );

  return <FootballEquipmentDefinitionIcon definition={definition} />;
}

export function FootballEquipmentDefinitionIcon({
  definition,
  size = TOOL_ICON_SIZE_PX,
}: {
  definition: EquipmentDefinition;
  size?: number;
}) {
  const drawCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const ratio =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const color = definition.color ?? "#111827";
    const appearance = definition.appearance ?? DEFAULT_RENDER_APPEARANCE;
    canvas.width = Math.floor(size * ratio);
    canvas.height = Math.floor(size * ratio);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(ratio, ratio);
    context.translate(size / 2, size / 2);
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = Math.max(1.5, size * 0.08);
    context.lineCap = "round";
    context.lineJoin = "round";

    const renderer = FOOTBALL_EQUIPMENT_RENDERERS[definition.kind];

    if (renderer) {
      renderer({
        context,
        equipment: {
          id: "tool-icon-equipment",
          type: "equipment",
          position: { x: 0, y: 0 },
          rotation: 0,
          size: {
            width: definition.defaultSize.width,
            height: definition.defaultSize.height,
            mode: "world",
          },
          props: {
            kind: definition.kind,
            color,
            appearance,
            definition,
          },
        } as EquipmentObject,
        color,
        width: size - 4,
        height: size - 4,
        strokeWidth: Math.max(1.5, size * 0.08),
      });
      return;
    }

    context.beginPath();
    context.roundRect(-(size - 8) / 2, -(size - 8) / 2, size - 8, size - 8, 4);
    context.stroke();
  }, [definition, size]);

  return (
    <canvas
      aria-hidden="true"
      className="h-5 w-5"
      ref={drawCanvas}
      style={{ width: size, height: size }}
    />
  );
}
