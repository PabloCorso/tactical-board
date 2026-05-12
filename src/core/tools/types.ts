import type { ObjectId, Point, ToolId } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import type { CanvasRect } from "../editor/board-editor-controller";
import type {
  CanvasObjectHitTester,
  CanvasObjectRenderer,
  CanvasOverlayItem,
  CanvasOverlayRenderer,
} from "../../rendering/canvas/types";

export interface ToolPointerEvent {
  point: Point;
  clientPoint: Point;
  canvasRect: CanvasRect;
  pointerId: number;
  targetObjectId?: ObjectId;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export interface ToolWheelEvent {
  point: Point;
  clientPoint: Point;
  canvasRect: CanvasRect;
  targetObjectId?: ObjectId;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  deltaX: number;
  deltaY: number;
}

export interface ToolApi {
  getState: () => BoardEditorState;
  addObjects: (
    objects: BoardEditorState["board"]["objects"]["byId"][string][],
  ) => void;
  moveObjects: (ids: ObjectId[], delta: Point) => void;
  duplicateObjects: (ids: ObjectId[]) => ObjectId[];
  deleteObjects: (ids: ObjectId[]) => void;
  updateObjects: (
    ids: ObjectId[],
    updater: (
      object: BoardEditorState["board"]["objects"]["byId"][string],
    ) => BoardEditorState["board"]["objects"]["byId"][string],
  ) => void;
  setPreviewObjects: (
    objects: BoardEditorState["rendering"]["previewObjects"],
  ) => void;
  clearPreviewObjects: () => void;
  panViewport: (delta: Point) => void;
  setToolState: (toolId: ToolId, value: unknown) => void;
  clearToolState: (toolId: ToolId) => void;
  registerObjectRenderer: (
    objectType: string,
    renderer: CanvasObjectRenderer,
  ) => void;
  registerObjectHitTester: (
    objectType: string,
    hitTester: CanvasObjectHitTester,
  ) => void;
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
}

export interface ToolActionDefinition {
  id: string;
  label: string;
  iconId?: string;
  tooltip?: string;
  active?: boolean;
  disabled?: boolean;
  onSelect: (api: ToolApi) => void;
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  getSecondaryActions?: (state: BoardEditorState) => ToolActionDefinition[];
  getOverlayItems?: (state: BoardEditorState) => CanvasOverlayItem[];
  registerRenderers?: (
    api: Pick<
      ToolApi,
      | "registerObjectRenderer"
      | "registerObjectHitTester"
      | "registerOverlayRenderer"
    >,
  ) => void;
  onActivate?: (api: ToolApi) => void;
  onDeactivate?: (api: ToolApi) => void;
  onPointerDown?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerMove?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerUp?: (event: ToolPointerEvent, api: ToolApi) => void;
  onWheel?: (event: ToolWheelEvent, api: ToolApi) => void;
}

export interface ToolRegistry {
  definitions: Record<ToolId, ToolDefinition>;
}
