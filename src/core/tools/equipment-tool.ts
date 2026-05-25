import type {
  ToolApi,
  ToolCapabilityRegistrationApi,
  ToolDefinition,
  ToolPointerEvent,
} from "./types";
import { defineObjectDefinition } from "../objects/types";
import { BoardEditorTool } from "./tool";
import type {
  CanvasObjectHitTestInput,
  CanvasObjectRenderInput,
  CanvasObjectRenderer,
} from "../rendering/canvas/types";
import {
  createEquipmentObject,
  EQUIPMENT_OBJECT_TYPE,
  getEquipmentDefinition,
  registerEquipmentDefinitions,
  type EquipmentDefinition,
  type EquipmentObject,
} from "../objects/equipment-object";
import {
  getAbsoluteCanvasExtent,
  getRelativeCanvasStrokeWidth,
} from "../rendering/canvas/object-render-scale";
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
    registerEquipmentDefinitions(options.definitions);
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
        definition,
      }),
    ]);
  }
}

function createEquipmentPreviewObject({
  id,
  point,
  definition,
}: {
  id: string;
  point: ToolPointerEvent["point"];
  definition: EquipmentDefinition;
}) {
  return createEquipmentObject({
    id,
    position: point,
    rotation: 0,
    size: {
      width: definition.defaultSize.width,
      height: definition.defaultSize.height,
    },
    kind: definition.kind,
    color: definition.color,
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

export function createEquipmentRenderer(
  renderersByKind: EquipmentCanvasRendererRegistry = {},
): CanvasObjectRenderer {
  return ({
    context,
    object,
    appearance,
    frameTransform,
  }: CanvasObjectRenderInput) => {
    const equipment = object as EquipmentObject;
    const definition = getEquipmentDefinition(equipment);
    const bounds = frameTransform.getObjectCanvasBounds(equipment);
    const width = getAbsoluteCanvasExtent(bounds.width);
    const height = getAbsoluteCanvasExtent(bounds.height);
    const color = equipment.props.color ?? definition?.color ?? "#000000";
    const strokeWidth = getRelativeCanvasStrokeWidth(
      Math.min(width, height),
      0.08,
    );

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
    }

    context.restore();
  };
}

export function hitTestEquipment({
  object,
  canvasPoint,
  frameTransform,
  minimumHitRadiusPx,
}: CanvasObjectHitTestInput) {
  const equipment = object as EquipmentObject;
  const definition = getEquipmentDefinition(equipment);
  const center = frameTransform.boardToCanvas(equipment.position);
  const bounds = frameTransform.getObjectCanvasBounds(equipment);
  const effectiveMinimumHitRadiusPx = Math.max(
    definition?.minimumHitRadiusPx ?? minimumHitRadiusPx,
    0,
  );
  const width = Math.max(
    Math.abs(bounds.width),
    effectiveMinimumHitRadiusPx * 2,
  );
  const height = Math.max(
    Math.abs(bounds.height),
    effectiveMinimumHitRadiusPx * 2,
  );
  const angle = -(((equipment.rotation ?? 0) * Math.PI) / 180);
  const dx = canvasPoint.x - center.x;
  const dy = canvasPoint.y - center.y;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
  const hitTestShape = definition?.hitTestShape ?? "rect";

  if (hitTestShape === "circle") {
    return Math.hypot(localX, localY) <= Math.max(width, height) / 2;
  }

  return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
}
