import type {
  ToolActionDefinition,
  ToolApi,
  ToolDefinition,
} from "../core/tools/types";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
} from "../rendering/canvas/types";
import {
  createEquipmentObject,
  EQUIPMENT_OBJECT_TYPE,
  type EquipmentDefinition,
  type EquipmentObject,
} from "../core/objects/equipment-object";
import { clearSelection } from "./select-tool-actions";
import {
  DEFAULT_EQUIPMENT_TOOL_STATE,
  EQUIPMENT_TOOL_ID,
  getEquipmentToolState,
} from "./equipment-tool-state";

const PREVIEW_OPACITY = 0.55;

export const DEFAULT_EQUIPMENT_DEFINITIONS: EquipmentDefinition[] = [
  {
    kind: "ball",
    label: "Ball",
    family: "ball",
    defaultSize: { width: 1.5, height: 1.5 },
    color: "#ffffff",
    capabilities: { color: true, label: true },
    lockedAspectRatio: true,
  },
  {
    kind: "cone",
    label: "Cone",
    family: "cone",
    defaultSize: { width: 1.8, height: 2.2 },
    color: "#ff6b35",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "disc-cone",
    label: "Disc Cone",
    family: "cone",
    defaultSize: { width: 2.2, height: 1.1 },
    color: "#ffc857",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "hoop",
    label: "Hoop",
    family: "frame",
    defaultSize: { width: 2.5, height: 2.5 },
    color: "#4db3ff",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "hurdle",
    label: "Hurdle",
    family: "frame",
    defaultSize: { width: 4, height: 2 },
    color: "#f8fafc",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "ladder",
    label: "Ladder",
    family: "ladder",
    defaultSize: { width: 6, height: 1.8 },
    color: "#facc15",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "mannequin",
    label: "Mannequin",
    family: "mannequin",
    defaultSize: { width: 1.8, height: 4.8 },
    color: "#1f2937",
    capabilities: { color: true, label: true },
    lockedAspectRatio: true,
  },
  {
    kind: "mini-goal",
    label: "Mini Goal",
    family: "frame",
    defaultSize: { width: 4, height: 2.4 },
    color: "#e5e7eb",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "goal",
    label: "Goal",
    family: "frame",
    defaultSize: { width: 7.32, height: 2.44 },
    color: "#ffffff",
    capabilities: { color: true },
    lockedAspectRatio: true,
  },
  {
    kind: "pole",
    label: "Pole",
    family: "pole",
    defaultSize: { width: 0.4, height: 3 },
    color: "#ff5a36",
    capabilities: { color: true, label: true },
    lockedAspectRatio: true,
  },
];

export interface CreateEquipmentToolOptions {
  definitions?: EquipmentDefinition[];
}

function createEquipmentId(existingIds: Record<string, unknown>) {
  let index = 1;

  while (existingIds[`equipment-${index}`]) {
    index += 1;
  }

  return `equipment-${index}`;
}

function findDefinition(
  definitionsByKind: Record<string, EquipmentDefinition>,
  kind: string,
) {
  return definitionsByKind[kind] ?? Object.values(definitionsByKind)[0];
}

function renderEquipmentFrame(
  context: CanvasRenderingContext2D,
  equipment: EquipmentObject,
  width: number,
  height: number,
) {
  if (equipment.props.kind === "hoop") {
    context.beginPath();
    context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.stroke();
    return;
  }

  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, 6);
  context.stroke();

  if (equipment.props.kind === "goal" || equipment.props.kind === "mini-goal") {
    context.globalAlpha *= 0.5;
    context.beginPath();
    context.moveTo(-width / 2, -height / 2);
    context.lineTo(-width / 4, height / 2);
    context.lineTo(width / 4, height / 2);
    context.lineTo(width / 2, -height / 2);
    context.stroke();
  }
}

function renderEquipment({
  context,
  object,
  appearance,
  surfaceTransform,
}: CanvasObjectRenderInput) {
  const equipment = object as EquipmentObject;
  const bounds = surfaceTransform.getObjectCanvasBounds(equipment);
  const width = Math.max(8, Math.abs(bounds.width));
  const height = Math.max(8, Math.abs(bounds.height));
  const color = equipment.props.color ?? equipment.props.definition.color ?? "#111827";
  const strokeWidth = Math.max(1.5, Math.min(width, height) * 0.08);

  context.save();
  context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
  context.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  context.rotate(((equipment.rotation ?? 0) * Math.PI) / 180);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = strokeWidth;
  context.lineCap = "round";
  context.lineJoin = "round";

  switch (equipment.props.definition.family) {
    case "ball":
      context.beginPath();
      context.arc(0, 0, Math.min(width, height) / 2, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(15, 23, 42, 0.35)";
      context.stroke();
      break;
    case "cone":
      context.beginPath();
      context.moveTo(0, -height / 2);
      context.lineTo(width / 2, height / 2);
      context.lineTo(-width / 2, height / 2);
      context.closePath();
      context.fill();
      context.globalAlpha *= 0.28;
      context.fillStyle = "#ffffff";
      context.fillRect(-width * 0.18, -height * 0.05, width * 0.36, height * 0.16);
      break;
    case "frame":
      context.fillStyle = "transparent";
      renderEquipmentFrame(context, equipment, width, height);
      break;
    case "ladder": {
      const railInset = height * 0.28;
      context.strokeRect(-width / 2, -height / 2 + railInset, width, height - railInset * 2);
      const rungCount = Math.max(3, Math.round(width / 20));
      for (let index = 1; index < rungCount; index += 1) {
        const x = -width / 2 + (width / rungCount) * index;
        context.beginPath();
        context.moveTo(x, -height / 2 + railInset);
        context.lineTo(x, height / 2 - railInset);
        context.stroke();
      }
      break;
    }
    case "mannequin":
      context.beginPath();
      context.arc(0, -height * 0.28, Math.min(width, height) * 0.16, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.roundRect(-width * 0.25, -height * 0.1, width * 0.5, height * 0.52, 8);
      context.stroke();
      context.beginPath();
      context.moveTo(-width * 0.18, height * 0.42);
      context.lineTo(-width * 0.3, height / 2);
      context.moveTo(width * 0.18, height * 0.42);
      context.lineTo(width * 0.3, height / 2);
      context.stroke();
      break;
    case "pole":
      context.fillRect(-width / 2, -height / 2, width, height);
      break;
  }

  if (equipment.props.label) {
    context.fillStyle =
      equipment.props.definition.family === "ball" ? "#111827" : color;
    context.font = `700 ${Math.max(11, Math.min(width, height) * 0.35)}px "ui-rounded", "SF Pro Display", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(equipment.props.label, 0, 0);
  }

  context.restore();
}

function hitTestEquipment({
  object,
  canvasPoint,
  surfaceTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const equipment = object as EquipmentObject;
  const center = surfaceTransform.worldToCanvas(equipment.position);
  const bounds = surfaceTransform.getObjectCanvasBounds(equipment);
  const width = Math.max(Math.abs(bounds.width), minimumHitRadiusPx * 2);
  const height = Math.max(Math.abs(bounds.height), minimumHitRadiusPx * 2);
  const angle = -(((equipment.rotation ?? 0) * Math.PI) / 180);
  const dx = canvasPoint.x - center.x;
  const dy = canvasPoint.y - center.y;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);

  if (equipment.props.definition.family === "ball") {
    return Math.hypot(localX, localY) <= Math.max(width, height) / 2;
  }

  return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
}

function createPresetSecondaryActions(
  definitions: EquipmentDefinition[],
): ToolDefinition["getSecondaryActions"] {
  return (state) => {
    const equipmentState = getEquipmentToolState(state.toolState);

    return definitions.map(
      (definition): ToolActionDefinition => ({
        id: `equipment-${definition.kind}`,
        label: definition.label,
        tooltip: definition.label,
        active: equipmentState.draftStyle.kind === definition.kind,
        disabled: false,
        onSelect: (api) => {
          const currentState = getEquipmentToolState(api.getState().toolState);
          api.setToolState(EQUIPMENT_TOOL_ID, {
            ...currentState,
            draftStyle: {
              ...currentState.draftStyle,
              kind: definition.kind,
            },
          });
        },
      }),
    );
  };
}

export function createEquipmentTool(
  options: CreateEquipmentToolOptions = {},
): ToolDefinition {
  const definitions =
    options.definitions && options.definitions.length > 0
      ? options.definitions
      : DEFAULT_EQUIPMENT_DEFINITIONS;
  const definitionsByKind = Object.fromEntries(
    definitions.map((definition) => [definition.kind, definition]),
  );

  return {
    id: EQUIPMENT_TOOL_ID,
    label: "Equipment",
    getSecondaryActions: createPresetSecondaryActions(definitions),
    onActivate: (api) => {
      const currentState = getEquipmentToolState(api.getState().toolState);
      const fallbackKind = definitions[0]?.kind ?? DEFAULT_EQUIPMENT_TOOL_STATE.draftStyle.kind;
      api.setToolState(EQUIPMENT_TOOL_ID, {
        ...currentState,
        draftStyle: {
          ...currentState.draftStyle,
          kind: definitionsByKind[currentState.draftStyle.kind]
            ? currentState.draftStyle.kind
            : fallbackKind,
        },
      });
    },
    onDeactivate: (api) => {
      api.clearPreviewObjects();
    },
    registerRenderers: (api) => {
      api.registerObjectRenderer(EQUIPMENT_OBJECT_TYPE, renderEquipment);
      api.registerObjectHitTester(EQUIPMENT_OBJECT_TYPE, hitTestEquipment);
    },
    onPointerDown: (event, api) => {
      const state = api.getState();
      const equipmentState = getEquipmentToolState(state.toolState);
      const definition = findDefinition(
        definitionsByKind,
        equipmentState.draftStyle.kind,
      );

      if (!definition) {
        return;
      }

      clearSelection(api);
      api.addObjects([
        createEquipmentObject({
          id: createEquipmentId(state.board.objects.byId),
          position: event.point,
          rotation: 0,
          size: {
            width: definition.defaultSize.width,
            height: definition.defaultSize.height,
            mode: "world",
            unit: state.board.surface.unit,
          },
          unit: state.board.surface.unit,
          kind: definition.kind,
          color: definition.color,
          definition,
        }),
      ]);
    },
    onPointerMove: () => {},
    onPointerUp: () => {},
  };
}

export const equipmentTool = createEquipmentTool();
