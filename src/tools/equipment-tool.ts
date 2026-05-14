import type {
  ToolApi,
  ToolCapabilityRegistrationApi,
  ToolDefinition,
  ToolPointerEvent,
} from "../core/tools/types";
import { defineObjectDefinition } from "../core/objects/types";
import { BoardEditorTool } from "../core/tools/tool";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
  CanvasObjectRenderer,
} from "../rendering/canvas/types";
import {
  createEquipmentObject,
  EQUIPMENT_OBJECT_TYPE,
  type EquipmentDefinition,
  type EquipmentObject,
} from "../core/objects/equipment-object";
import type { MeasurementUnit } from "../core/board/types";
import { renderObjectAppearanceAsset } from "../rendering/canvas/object-appearance-renderer";
import { clearSelection } from "./select-tool-actions";
import { equipmentSelectionAdapter } from "./equipment-selection";
import {
  DEFAULT_EQUIPMENT_TOOL_STATE,
  EQUIPMENT_TOOL_ID,
  getEquipmentToolState,
} from "./equipment-tool-state";

const PREVIEW_OPACITY = 0.55;

type CreateEquipmentToolOptions = {
  definitions: EquipmentDefinition[];
  renderersByKind?: EquipmentCanvasRendererRegistry;
};

export type EquipmentCanvasRenderInput = {
  context: CanvasRenderingContext2D;
  equipment: EquipmentObject;
  color: string;
  width: number;
  height: number;
  strokeWidth: number;
};

export type EquipmentCanvasRenderer = (
  input: EquipmentCanvasRenderInput,
) => void;

export type EquipmentCanvasRendererRegistry = Record<
  string,
  EquipmentCanvasRenderer
>;

const equipmentObjectDefinition = defineObjectDefinition({
  type: EQUIPMENT_OBJECT_TYPE,
  selection: equipmentSelectionAdapter,
});

export class EquipmentTool extends BoardEditorTool implements ToolDefinition {
  readonly id = EQUIPMENT_TOOL_ID;
  readonly label = "Equipment";

  private readonly definitions: EquipmentDefinition[];
  private readonly definitionsByKind: Record<string, EquipmentDefinition>;
  private readonly renderEquipment;

  constructor(options: CreateEquipmentToolOptions) {
    super();

    if (options.definitions.length === 0) {
      throw new Error(
        "createEquipmentTool requires at least one equipment definition",
      );
    }

    this.definitions = options.definitions;
    this.definitionsByKind = Object.fromEntries(
      options.definitions.map((definition) => [definition.kind, definition]),
    );
    this.renderEquipment = createEquipmentRenderer(options.renderersByKind);
  }

  onActivate(api: ToolApi) {
    const currentState = getEquipmentToolState(api.getState().toolState);
    const fallbackKind =
      this.definitions[0]?.kind ?? DEFAULT_EQUIPMENT_TOOL_STATE.draftStyle.kind;
    api.setToolState(EQUIPMENT_TOOL_ID, {
      ...currentState,
      draftStyle: {
        ...currentState.draftStyle,
        kind: this.definitionsByKind[currentState.draftStyle.kind]
          ? currentState.draftStyle.kind
          : fallbackKind,
      },
    });
  }

  onDeactivate(api: ToolApi) {
    api.clearPreviewObjects();
  }

  registerCapabilities(api: ToolCapabilityRegistrationApi) {
    api.registerObjectRenderer(EQUIPMENT_OBJECT_TYPE, this.renderEquipment);
    api.registerObjectHitTester(EQUIPMENT_OBJECT_TYPE, hitTestEquipment);
    api.registerObjectDefinition(equipmentObjectDefinition);
  }

  onPointerDown(event: ToolPointerEvent, api: ToolApi) {
    const state = api.getState();
    const equipmentState = getEquipmentToolState(state.toolState);
    const definition = findDefinition(
      this.definitionsByKind,
      equipmentState.draftStyle.kind,
    );

    if (!definition) {
      return;
    }

    clearSelection(api);
    api.addObjects([
      createEquipmentPreviewObject({
        id: createEquipmentId(state.board.objects.byId),
        point: event.point,
        unit: state.board.surface.unit,
        definition,
      }),
    ]);
  }

  onPointerMove(event: ToolPointerEvent, api: ToolApi) {
    const state = api.getState();
    const equipmentState = getEquipmentToolState(state.toolState);
    const definition = findDefinition(
      this.definitionsByKind,
      equipmentState.draftStyle.kind,
    );

    if (!definition) {
      api.clearPreviewObjects();
      return;
    }

    api.setPreviewObjects([
      createEquipmentPreviewObject({
        id: "equipment-preview",
        point: event.point,
        unit: state.board.surface.unit,
        definition,
      }),
    ]);
  }
}

function createEquipmentPreviewObject({
  id,
  point,
  unit,
  definition,
}: {
  id: string;
  point: ToolPointerEvent["point"];
  unit?: MeasurementUnit;
  definition: EquipmentDefinition;
}) {
  return createEquipmentObject({
    id,
    position: point,
    rotation: 0,
    size: {
      width: definition.defaultSize.width,
      height: definition.defaultSize.height,
      mode: "world",
      unit,
    },
    unit,
    kind: definition.kind,
    color: definition.color,
    appearance: definition.appearance,
    definition,
  });
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
  width: number,
  height: number,
) {
  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, 6);
  context.stroke();
}

function createEquipmentRenderer(
  renderersByKind: EquipmentCanvasRendererRegistry = {},
): CanvasObjectRenderer {
  return ({
    context,
    object,
    appearance,
    requestRender,
    surfaceTransform,
  }: CanvasObjectRenderInput) => {
    const equipment = object as EquipmentObject;
    const bounds = surfaceTransform.getObjectCanvasBounds(equipment);
    const width = Math.max(8, Math.abs(bounds.width));
    const height = Math.max(8, Math.abs(bounds.height));
    const color =
      equipment.props.color ?? equipment.props.definition.color ?? "#111827";
    const strokeWidth = Math.max(1.5, Math.min(width, height) * 0.08);

    context.save();
    context.globalAlpha = appearance === "preview" ? PREVIEW_OPACITY : 1;
    context.translate(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
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
      const customRenderer = renderersByKind[equipment.props.kind];

      if (customRenderer) {
        customRenderer({
          context,
          equipment,
          color,
          width,
          height,
          strokeWidth,
        });
      } else {
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
            context.fillRect(
              -width * 0.18,
              -height * 0.05,
              width * 0.36,
              height * 0.16,
            );
            break;
          case "frame":
            context.fillStyle = "transparent";
            renderEquipmentFrame(context, width, height);
            break;
          default:
            context.fillStyle = "transparent";
            renderEquipmentFrame(context, width, height);
            break;
        }
      }
    }

    context.restore();
  };
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
