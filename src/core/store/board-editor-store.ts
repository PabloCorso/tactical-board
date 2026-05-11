import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  Board,
  BoardObjectBase,
  ObjectId,
  Point,
  ToolId,
} from "../board/types";
import type { BoardEditorState } from "../editor/types";
import type { ToolDefinition, ToolRegistry } from "../tools/types";
import type {
  CanvasObjectRendererRegistry,
  CanvasOverlayRendererRegistry,
} from "../../rendering/canvas/types";
import {
  getSelectToolState,
  SELECT_TOOL_ID,
} from "../../tools/select-tool-state";

export interface CreateBoardEditorStoreOptions<
  TObject extends BoardObjectBase = BoardObjectBase,
> {
  initialBoard: Board<TObject>;
  tools?: ToolDefinition[];
  initialToolId?: ToolId;
  objectRenderers?: CanvasObjectRendererRegistry;
  overlayRenderers?: CanvasOverlayRendererRegistry;
}

export type BoardEditorStore<
  TObject extends BoardObjectBase = BoardObjectBase,
> = StoreApi<BoardEditorState<TObject>>;

function createToolRegistry(tools: ToolDefinition[] = []): ToolRegistry {
  return {
    definitions: Object.fromEntries(tools.map((tool) => [tool.id, tool])),
  };
}

export function createBoardEditorStore<TObject extends BoardObjectBase>({
  initialBoard,
  tools = [],
  initialToolId = SELECT_TOOL_ID,
  objectRenderers = {},
  overlayRenderers = {},
}: CreateBoardEditorStoreOptions<TObject>): BoardEditorStore<TObject> {
  const toolRegistry = createToolRegistry(tools);
  const fallbackToolId = tools[0]?.id ?? initialToolId;
  const activeToolId = toolRegistry.definitions[initialToolId]
    ? initialToolId
    : fallbackToolId;

  return createStore<BoardEditorState<TObject>>((set) => ({
    board: initialBoard,
    ui: {
      activeToolId,
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
    },
    rendering: {
      previewObjects: [],
      overlayItems: [],
      objectRenderers: { ...objectRenderers },
      overlayRenderers: { ...overlayRenderers },
    },
    toolState: {},
    toolRegistry,
    actions: {
      setActiveTool: (toolId) => {
        set((state) => {
          if (!state.toolRegistry.definitions[toolId]) {
            return state;
          }

          if (toolId !== SELECT_TOOL_ID) {
            const nextToolState = { ...state.toolState };
            delete nextToolState[SELECT_TOOL_ID];

            return {
              ui: {
                ...state.ui,
                activeToolId: toolId,
              },
              rendering: {
                ...state.rendering,
                overlayItems: [],
              },
              toolState: nextToolState,
            };
          }

          return {
            ui: {
              ...state.ui,
              activeToolId: toolId,
            },
          };
        });
      },
      setSelectedObjectIds: (objectIds) => {
        set((state) => ({
          toolState: {
            ...state.toolState,
            [SELECT_TOOL_ID]: {
              ...getSelectToolState(state.toolState),
              selectedObjectIds: [...objectIds],
            },
          },
        }));
      },
      clearSelection: () => {
        set((state) => ({
          toolState: {
            ...state.toolState,
            [SELECT_TOOL_ID]: {
              ...getSelectToolState(state.toolState),
              selectedObjectIds: [],
            },
          },
        }));
      },
      setPreviewObjects: (objects) => {
        set((state) => ({
          rendering: {
            ...state.rendering,
            previewObjects: [...objects],
          },
        }));
      },
      clearPreviewObjects: () => {
        set((state) => ({
          rendering: {
            ...state.rendering,
            previewObjects: [],
          },
        }));
      },
      setOverlayItems: (items) => {
        set((state) => ({
          rendering: {
            ...state.rendering,
            overlayItems: [...items],
          },
        }));
      },
      clearOverlayItems: () => {
        set((state) => ({
          rendering: {
            ...state.rendering,
            overlayItems: [],
          },
        }));
      },
      panViewport: (delta: Point) => {
        set((state) => ({
          ui: {
            ...state.ui,
            viewport: {
              ...state.ui.viewport,
              pan: {
                x: state.ui.viewport.pan.x + delta.x,
                y: state.ui.viewport.pan.y + delta.y,
              },
            },
          },
        }));
      },
      moveObjects: (objectIds: ObjectId[], delta: Point) => {
        set((state) => {
          let changed = false;
          const nextById = { ...state.board.objects.byId };

          for (const objectId of objectIds) {
            const object = nextById[objectId];
            if (!object || object.locked) {
              continue;
            }

            changed = true;
            nextById[objectId] = {
              ...object,
              position: {
                x: object.position.x + delta.x,
                y: object.position.y + delta.y,
              },
            };
          }

          if (!changed) {
            return state;
          }

          return {
            board: {
              ...state.board,
              objects: {
                ...state.board.objects,
                byId: nextById,
              },
            },
          };
        });
      },
      setToolState: (toolId, value) => {
        set((state) => ({
          toolState: {
            ...state.toolState,
            [toolId]: value,
          },
        }));
      },
      clearToolState: (toolId) => {
        set((state) => {
          const nextToolState = { ...state.toolState };
          delete nextToolState[toolId];

          return {
            toolState: nextToolState,
          };
        });
      },
      registerTool: (tool) => {
        set((state) => ({
          toolRegistry: {
            definitions: {
              ...state.toolRegistry.definitions,
              [tool.id]: tool,
            },
          },
        }));
      },
      registerObjectRenderer: (objectType, renderer) => {
        set((state) => ({
          rendering: {
            ...state.rendering,
            objectRenderers: {
              ...state.rendering.objectRenderers,
              [objectType]: renderer,
            },
          },
        }));
      },
      registerOverlayRenderer: (overlayKind, renderer) => {
        set((state) => ({
          rendering: {
            ...state.rendering,
            overlayRenderers: {
              ...state.rendering.overlayRenderers,
              [overlayKind]: renderer,
            },
          },
        }));
      },
    },
  }));
}
