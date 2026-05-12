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
  duplicateObjects: (ids: ObjectId[]) => ObjectId[];
  deleteObjects: (ids: ObjectId[]) => void;
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
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
}

export interface ToolActionDefinition {
  id: string;
  label: string;
  tooltip?: string;
  disabled?: boolean;
  onSelect: (api: ToolApi) => void;
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  getSecondaryActions?: (
    state: BoardEditorState,
  ) => ToolActionDefinition[];
  getOverlayItems?: (state: BoardEditorState) => CanvasOverlayItem[];
  registerRenderers?: (
    api: Pick<ToolApi, "registerObjectRenderer" | "registerOverlayRenderer">,
  ) => void;
  onPointerDown?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerMove?: (event: ToolPointerEvent, api: ToolApi) => void;
  onPointerUp?: (event: ToolPointerEvent, api: ToolApi) => void;
}

export interface ToolRegistry {
  definitions: Record<ToolId, ToolDefinition>;
}
