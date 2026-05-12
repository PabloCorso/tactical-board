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

function createDuplicatedObjectId(
  objectId: ObjectId,
  existingObjects: Record<ObjectId, BoardObjectBase>,
) {
  const baseId = `${objectId}-copy`;
  let candidateId = baseId;
  let suffix = 2;

  while (existingObjects[candidateId]) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidateId;
}

export function createBoardEditorStore<TObject extends BoardObjectBase>({
  initialBoard,
  tools = [],
  initialToolId,
  objectRenderers = {},
  overlayRenderers = {},
}: CreateBoardEditorStoreOptions<TObject>): BoardEditorStore<TObject> {
  const toolRegistry = createToolRegistry(tools);
  const activeToolId =
    initialToolId && toolRegistry.definitions[initialToolId]
      ? initialToolId
      : tools[0]?.id ?? initialToolId ?? ""

  return createStore<BoardEditorState<TObject>>((set, get) => ({
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

          return {
            ui: {
              ...state.ui,
              activeToolId: toolId,
            },
          };
        });
      },
      duplicateObjects: (objectIds) => {
        const state = get();
        const nextById = { ...state.board.objects.byId };
        const nextOrder = [...state.board.objects.order];
        const duplicateIds: ObjectId[] = [];

        for (const objectId of objectIds) {
          const object = nextById[objectId];
          if (!object) {
            continue;
          }

          const duplicateId = createDuplicatedObjectId(objectId, nextById);
          duplicateIds.push(duplicateId);
          nextById[duplicateId] = {
            ...object,
            id: duplicateId,
            position: {
              x: object.position.x + 2,
              y: object.position.y + 2,
            },
          } as TObject;
          nextOrder.push(duplicateId);
        }

        if (duplicateIds.length === 0) {
          return [];
        }

        set((currentState) => ({
          board: {
            ...currentState.board,
            objects: {
              ...currentState.board.objects,
              byId: nextById,
              order: nextOrder,
            },
          },
        }));

        return duplicateIds;
      },
      deleteObjects: (objectIds) => {
        set((state) => {
          const objectIdsToDelete = new Set(objectIds);
          let changed = false;
          const nextById = { ...state.board.objects.byId };

          for (const objectId of objectIdsToDelete) {
            if (!nextById[objectId]) {
              continue;
            }

            delete nextById[objectId];
            changed = true;
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
                order: state.board.objects.order.filter(
                  (objectId) => !objectIdsToDelete.has(objectId),
                ),
              },
            },
          };
        });
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
        set((state) => {
          if (state.rendering.objectRenderers[objectType] === renderer) {
            return state;
          }

          return {
            rendering: {
              ...state.rendering,
              objectRenderers: {
                ...state.rendering.objectRenderers,
                [objectType]: renderer,
              },
            },
          };
        });
      },
      registerOverlayRenderer: (overlayKind, renderer) => {
        set((state) => {
          if (state.rendering.overlayRenderers[overlayKind] === renderer) {
            return state;
          }

          return {
            rendering: {
              ...state.rendering,
              overlayRenderers: {
                ...state.rendering.overlayRenderers,
                [overlayKind]: renderer,
              },
            },
          };
        });
      },
    },
  }));
}
