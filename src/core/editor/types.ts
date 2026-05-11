import type {
  Board,
  BoardObjectBase,
  ObjectId,
  Point,
  ToolId,
} from "../board/types";
import type { ToolDefinition, ToolRegistry } from "../tools/types";
import type {
  CanvasObjectRenderer,
  CanvasObjectRendererRegistry,
  CanvasOverlayItem,
  CanvasOverlayRenderer,
  CanvasOverlayRendererRegistry,
} from "../../rendering/canvas/types";

export interface BoardViewport {
  pan: Point;
  zoom: number;
}

export interface BoardEditorUiState {
  activeToolId: ToolId;
  hoveredObjectId?: ObjectId;
  viewport: BoardViewport;
}

export interface BoardEditorRenderingState {
  previewObjects: BoardObjectBase[];
  overlayItems: CanvasOverlayItem[];
  objectRenderers: CanvasObjectRendererRegistry;
  overlayRenderers: CanvasOverlayRendererRegistry;
}

export type BoardEditorToolState = Record<string, unknown>;

export interface BoardEditorActions {
  setActiveTool: (toolId: ToolId) => void;
  setSelectedObjectIds: (objectIds: ObjectId[]) => void;
  clearSelection: () => void;
  setPreviewObjects: (objects: BoardObjectBase[]) => void;
  clearPreviewObjects: () => void;
  setOverlayItems: (items: CanvasOverlayItem[]) => void;
  clearOverlayItems: () => void;
  moveObjects: (objectIds: ObjectId[], delta: Point) => void;
  panViewport: (delta: Point) => void;
  setToolState: (toolId: ToolId, value: unknown) => void;
  clearToolState: (toolId: ToolId) => void;
  registerTool: (tool: ToolDefinition) => void;
  registerObjectRenderer: (
    objectType: string,
    renderer: CanvasObjectRenderer,
  ) => void;
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
}

export interface BoardEditorState<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  board: Board<TObject>;
  ui: BoardEditorUiState;
  rendering: BoardEditorRenderingState;
  toolState: BoardEditorToolState;
  toolRegistry: ToolRegistry;
  actions: BoardEditorActions;
}
