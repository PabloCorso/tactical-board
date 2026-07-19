import type {
  Board,
  BoardFrameConfig,
  BoardObject,
  ObjectId,
  Point,
  ToolId,
} from "../board/types";
import type { ToolDefinition, ToolRegistry } from "../tools/types";
import type {
  CanvasOverlayRenderer,
  CanvasOverlayRendererRegistry,
} from "../rendering/canvas/types";
import type { ObjectRegistry } from "../objects/types";
import type { FitPadding, ViewportZoomScaleLimits } from "./viewport-utils";

export interface BoardViewport {
  pan: Point;
  zoom: number;
}

export type BoardEditorNavigationMode = "free" | "contained";
export type BoardEditorFitPadding =
  | FitPadding
  | ((frame: BoardFrameConfig) => FitPadding | undefined);

export interface BoardEditorUiState {
  activeToolId: ToolId;
  defaultToolId: ToolId;
  hoveredObjectId?: ObjectId;
  canvasRect?: {
    width: number;
    height: number;
  };
  viewport: BoardViewport;
  fitPadding?: BoardEditorFitPadding;
  navigationMode: BoardEditorNavigationMode;
  zoomScaleLimits?: ViewportZoomScaleLimits;
}

export interface BoardEditorRenderingState {
  previewObjects: BoardObject[];
  overlayRenderers: CanvasOverlayRendererRegistry;
}

export interface BoardEditorHistoryEntry {
  board: Board;
  selectedObjectIds: ObjectId[];
}

export interface BoardEditorHistoryState {
  past: BoardEditorHistoryEntry[];
  future: BoardEditorHistoryEntry[];
}

export type BoardEditorToolState = Record<string, unknown>;

export interface BoardEditorSelectionState {
  selectedObjectIds: ObjectId[];
}

export interface BoardEditorActions {
  setActiveTool: (toolId: ToolId) => void;
  resetTool: () => void;
  setCanvasRect: (rect: { width: number; height: number }) => void;
  setViewport: (viewport: BoardViewport) => void;
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  undo: () => void;
  redo: () => void;
  setFrame: (frame: BoardFrameConfig) => void;
  updateBoard: (updater: (board: Board) => Board) => void;
  addObjects: (objects: BoardObject[]) => void;
  bringObjectsToFront: (objectIds: ObjectId[]) => void;
  duplicateObjects: (objectIds: ObjectId[]) => ObjectId[];
  deleteObjects: (objectIds: ObjectId[]) => void;
  sendObjectsToBack: (objectIds: ObjectId[]) => void;
  updateObjects: (
    objectIds: ObjectId[],
    updater: (object: BoardObject) => BoardObject,
  ) => void;
  setPreviewObjects: (objects: BoardObject[]) => void;
  clearPreviewObjects: () => void;
  moveObjects: (objectIds: ObjectId[], delta: Point) => void;
  panViewport: (delta: Point) => void;
  setSelectedObjectIds: (objectIds: ObjectId[]) => void;
  clearSelection: () => void;
  setToolState: (toolId: ToolId, value: unknown) => void;
  clearToolState: (toolId: ToolId) => void;
  registerTool: (tool: ToolDefinition) => void;
  registerOverlayRenderer: (
    overlayKind: string,
    renderer: CanvasOverlayRenderer,
  ) => void;
}

export interface BoardEditorState {
  board: Board;
  history: BoardEditorHistoryState;
  ui: BoardEditorUiState;
  selection: BoardEditorSelectionState;
  rendering: BoardEditorRenderingState;
  objectRegistry: ObjectRegistry;
  toolState: BoardEditorToolState;
  toolRegistry: ToolRegistry;
  actions: BoardEditorActions;
}
