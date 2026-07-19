import type { BoardFrameConfig, ObjectId, Point, ToolId } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import type { CanvasRect } from "../editor/board-editor-controller";
import type {
  CanvasOverlayItem,
  CanvasOverlayRenderer,
} from "../rendering/canvas/types";
import type { SelectionPresentation } from "./selection-presentation";

export interface ToolPointerEvent {
  point: Point;
  clientPoint: Point;
  canvasRect: CanvasRect;
  pointerId: number;
  button: number;
  interactionStartPoint: Point;
  interactionStartClientPoint: Point;
  draggedSincePointerDown: boolean;
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

export interface ToolKeyboardEvent {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export interface ToolApi {
  getState: () => BoardEditorState;
  resetTool: () => void;
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  addObjects: (
    objects: BoardEditorState["board"]["objects"]["byId"][string][],
  ) => void;
  bringObjectsToFront: (ids: ObjectId[]) => void;
  moveObjects: (ids: ObjectId[], delta: Point) => void;
  duplicateObjects: (ids: ObjectId[]) => ObjectId[];
  deleteObjects: (ids: ObjectId[]) => void;
  sendObjectsToBack: (ids: ObjectId[]) => void;
  setFrame: (frame: BoardFrameConfig) => void;
  updateBoard: (
    updater: (board: BoardEditorState["board"]) => BoardEditorState["board"],
  ) => void;
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
  setSelectedObjectIds: (ids: ObjectId[]) => void;
  clearSelection: () => void;
  setToolState: (toolId: ToolId, value: unknown) => void;
  clearToolState: (toolId: ToolId) => void;
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
}

export interface ToolCapabilityRegistrationApi {
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  completeInteraction?: (api: ToolApi) => boolean;
  getOverlayItems?: (state: BoardEditorState) => CanvasOverlayItem[];
  getSelectionPresentation?: (state: BoardEditorState) => SelectionPresentation;
  getCursor?: (event: ToolPointerEvent, api: ToolApi) => string | undefined;
  registerCapabilities?: (api: ToolCapabilityRegistrationApi) => void;
  onActivate?: (api: ToolApi) => void;
  onDeactivate?: (api: ToolApi) => void;
  onPointerDown?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerMove?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerUp?: (event: ToolPointerEvent, api: ToolApi) => void;
  onWheel?: (event: ToolWheelEvent, api: ToolApi) => void;
  onKeyDown?: (event: ToolKeyboardEvent, api: ToolApi) => boolean | void;
  onEscapeKey?: (api: ToolApi) => boolean | void;
  shouldFocusCanvasOnPointerDown?: (api: ToolApi) => boolean;
  shouldKeepPreviewOnPointerLeave?: (api: ToolApi) => boolean;
  shouldPreventContextMenu?: (api: ToolApi) => boolean;
}

export interface ToolRegistry {
  definitions: Record<ToolId, ToolDefinition>;
}
