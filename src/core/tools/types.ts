import type { ObjectId, Point, ToolId } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import type { CanvasRect } from "../editor/board-editor-controller";
import type {
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

export interface ToolApi {
  getState: () => BoardEditorState;
  moveObjects: (ids: ObjectId[], delta: Point) => void;
  setSelectedObjectIds: (ids: ObjectId[]) => void;
  clearSelection: () => void;
  setPreviewObjects: (
    objects: BoardEditorState["rendering"]["previewObjects"],
  ) => void;
  clearPreviewObjects: () => void;
  setOverlayItems: (items: CanvasOverlayItem[]) => void;
  clearOverlayItems: () => void;
  panViewport: (delta: Point) => void;
  setToolState: (toolId: ToolId, value: unknown) => void;
  clearToolState: (toolId: ToolId) => void;
  registerObjectRenderer: (
    objectType: string,
    renderer: CanvasObjectRenderer,
  ) => void;
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  onPointerDown?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerMove?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerUp?: (event: ToolPointerEvent, api: ToolApi) => void;
}

export interface ToolRegistry {
  definitions: Record<ToolId, ToolDefinition>;
}
