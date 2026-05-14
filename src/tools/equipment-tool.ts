import type { ToolActionDefinition, ToolDefinition } from "../core/tools/types";
import { defineObjectDefinition } from "../core/objects/types";
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
import { renderObjectAppearanceAsset } from "../rendering/canvas/object-appearance-renderer";
import { clearSelection } from "./select-tool-actions";
import { equipmentSelectionAdapter } from "./equipment-selection";
import {
  DEFAULT_EQUIPMENT_TOOL_STATE,
  EQUIPMENT_TOOL_ID,
  getEquipmentToolState,
} from "./equipment-tool-state";

const PREVIEW_OPACITY = 0.55;

export interface CreateEquipmentToolOptions {
  definitions: EquipmentDefinition[];
}

export const equipmentObjectDefinition = defineObjectDefinition({
  type: EQUIPMENT_OBJECT_TYPE,
  selection: equipmentSelectionAdapter,
});

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

let soccerBallPanelPathCache: Path2D | null | undefined;

function getSoccerBallPanelPath() {
  if (soccerBallPanelPathCache !== undefined) {
    return soccerBallPanelPathCache;
  }

  if (typeof Path2D === "undefined") {
    soccerBallPanelPathCache = null;
    return soccerBallPanelPathCache;
  }

  soccerBallPanelPathCache = new Path2D(
    "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,39.38,24.79-17.05a88.41,88.41,0,0,1,36.18,27l-8,26.94c-.2,0-.41.1-.61.17l-22.82,7.41a7.59,7.59,0,0,0-1,.4L136,88.62c0-.2,0-.41,0-.62V64C136,63.79,136,63.58,136,63.38ZM95.24,46.33,120,63.38c0,.2,0,.41,0,.62V88c0,.21,0,.42,0,.62L91.44,108.29a7.59,7.59,0,0,0-1-.4l-22.82-7.41c-.2-.07-.41-.12-.61-.17l-8-26.94A88.41,88.41,0,0,1,95.24,46.33Zm-13,129.09H53.9a87.4,87.4,0,0,1-13.79-43.07l22-16.88a5.77,5.77,0,0,0,.58.22l22.83,7.42a7.83,7.83,0,0,0,.93.22l10.79,31.42c-.15.18-.3.36-.44.55L82.7,174.71A7.8,7.8,0,0,0,82.24,175.42ZM150.69,213a88.16,88.16,0,0,1-45.38,0L95.25,184.6c.13-.16.27-.31.39-.48l14.11-19.42a7.66,7.66,0,0,0,.46-.7h35.58a7.66,7.66,0,0,0,.46.7l14.11,19.42c.12.17.26.32.39.48Zm23.07-37.61a7.8,7.8,0,0,0-.46-.71L159.19,155.3c-.14-.19-.29-.37-.44-.55l10.79-31.42a7.83,7.83,0,0,0,.93-.22l22.83-7.42a5.77,5.77,0,0,0,.58-.22l22,16.88a87.4,87.4,0,0,1-13.79,43.07Z",
  );

  return soccerBallPanelPathCache;
}

function renderSoccerBall(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const scale = Math.min(width, height) / 256;
  const panelPath = getSoccerBallPanelPath();

  context.save();
  context.scale(scale, scale);
  context.translate(-128, -128);

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(128, 128, 100, 0, Math.PI * 2);
  context.fill();

  if (panelPath) {
    context.fillStyle = "#000000";
    context.fill(panelPath);
  } else {
    context.fillStyle = "#000000";
    context.beginPath();
    context.arc(128, 128, 80, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function renderEquipment({
  context,
  object,
  appearance,
  requestRender,
  surfaceTransform,
}: CanvasObjectRenderInput) {
  const equipment = object as EquipmentObject;
  const bounds = surfaceTransform.getObjectCanvasBounds(equipment);
  const width = Math.max(8, Math.abs(bounds.width));
  const height = Math.max(8, Math.abs(bounds.height));
  const color =
    equipment.props.color ?? equipment.props.definition.color ?? "#111827";
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

  const renderedAsset = renderObjectAppearanceAsset({
    appearance: equipment.props.appearance,
    context,
    height,
    requestRender,
    width,
  });

  if (!renderedAsset) {
    switch (equipment.props.definition.family) {
      case "ball":
        if (equipment.props.kind === "soccer-ball") {
          renderSoccerBall(context, width, height);
          break;
        }
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
        context.fillRect(
          -width * 0.18,
          -height * 0.05,
          width * 0.36,
          height * 0.16,
        );
        break;
      case "frame":
        context.fillStyle = "transparent";
        renderEquipmentFrame(context, equipment, width, height);
        break;
      case "ladder": {
        const railInset = height * 0.28;
        context.strokeRect(
          -width / 2,
          -height / 2 + railInset,
          width,
          height - railInset * 2,
        );
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
        context.arc(
          0,
          -height * 0.28,
          Math.min(width, height) * 0.16,
          0,
          Math.PI * 2,
        );
        context.stroke();
        context.beginPath();
        context.roundRect(
          -width * 0.25,
          -height * 0.1,
          width * 0.5,
          height * 0.52,
          8,
        );
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
  options: CreateEquipmentToolOptions,
): ToolDefinition {
  const definitions = options.definitions;

  if (definitions.length === 0) {
    throw new Error(
      "createEquipmentTool requires at least one equipment definition",
    );
  }

  const definitionsByKind = Object.fromEntries(
    definitions.map((definition) => [definition.kind, definition]),
  );

  return {
    id: EQUIPMENT_TOOL_ID,
    label: "Equipment",
    getSecondaryActions: createPresetSecondaryActions(definitions),
    onActivate: (api) => {
      const currentState = getEquipmentToolState(api.getState().toolState);
      const fallbackKind =
        definitions[0]?.kind ?? DEFAULT_EQUIPMENT_TOOL_STATE.draftStyle.kind;
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
    registerCapabilities: (api) => {
      api.registerObjectRenderer(EQUIPMENT_OBJECT_TYPE, renderEquipment);
      api.registerObjectHitTester(EQUIPMENT_OBJECT_TYPE, hitTestEquipment);
      api.registerObjectDefinition(equipmentObjectDefinition);
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
          appearance: definition.appearance,
          definition,
        }),
      ]);
    },
    onPointerMove: () => {},
    onPointerUp: () => {},
  };
}
