import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  Board,
  BoardObject,
  ObjectId,
  Point,
  ToolId,
} from "../board/types";
import type { BoardEditorState } from "../editor/types";
import {
  moveBoardObject,
} from "../objects/object-behaviors";
import type { ToolApi, ToolDefinition, ToolRegistry } from "../tools/types";
import type {
  CanvasObjectHitTesterRegistry,
  CanvasObjectRendererRegistry,
  CanvasOverlayRendererRegistry,
} from "../../rendering/canvas/types";

export interface CreateBoardEditorStoreOptions {
  initialBoard: Board;
  tools?: ToolDefinition[];
  initialToolId?: ToolId;
  objectRenderers?: CanvasObjectRendererRegistry;
  objectHitTesters?: CanvasObjectHitTesterRegistry;
  overlayRenderers?: CanvasOverlayRendererRegistry;
}

export type BoardEditorStore = StoreApi<BoardEditorState>;

function createToolRegistry(tools: ToolDefinition[] = []): ToolRegistry {
  return {
    definitions: Object.fromEntries(tools.map((tool) => [tool.id, tool])),
  };
}

function createDuplicatedObjectId(
  objectId: ObjectId,
  existingObjects: Record<ObjectId, BoardObject>,
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

function translateObject(object: BoardObject, delta: Point): BoardObject {
  return moveBoardObject(object, delta);
}

export function createBoardEditorStore({
  initialBoard,
  tools = [],
  initialToolId,
  objectRenderers = {},
  objectHitTesters = {},
  overlayRenderers = {},
}: CreateBoardEditorStoreOptions): BoardEditorStore {
  const toolRegistry = createToolRegistry(tools);
  const activeToolId =
    initialToolId && toolRegistry.definitions[initialToolId]
      ? initialToolId
      : (tools[0]?.id ?? initialToolId ?? "");

  return createStore<BoardEditorState>((set, get) => ({
    board: initialBoard,
    ui: {
      activeToolId,
      canvasRect: undefined,
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
    },
    rendering: {
      previewObjects: [],
      objectRenderers: { ...objectRenderers },
      objectHitTesters: { ...objectHitTesters },
      overlayRenderers: { ...overlayRenderers },
    },
    toolState: {},
    toolRegistry,
    actions: {
      setActiveTool: (toolId) => {
        set((state) => {
          if (
            !state.toolRegistry.definitions[toolId] ||
            state.ui.activeToolId === toolId
          ) {
            return state;
          }

          const actions = get().actions;
          const toolApi: ToolApi = {
            getState: () => get(),
            addObjects: actions.addObjects,
            moveObjects: actions.moveObjects,
            duplicateObjects: actions.duplicateObjects,
            deleteObjects: actions.deleteObjects,
            updateObjects: actions.updateObjects,
            setPreviewObjects: actions.setPreviewObjects,
            clearPreviewObjects: actions.clearPreviewObjects,
            panViewport: actions.panViewport,
            setToolState: actions.setToolState,
            clearToolState: actions.clearToolState,
            registerObjectRenderer: actions.registerObjectRenderer,
            registerObjectHitTester: actions.registerObjectHitTester,
            registerOverlayRenderer: actions.registerOverlayRenderer,
          };
          const toolsToDeactivate = Object.values(
            state.toolRegistry.definitions,
          ).filter((tool) => tool.id !== toolId);
          const toolToActivate = state.toolRegistry.definitions[toolId];

          for (const tool of toolsToDeactivate) {
            tool.onDeactivate?.(toolApi);
          }

          toolToActivate?.onActivate?.(toolApi);

          return {
            rendering: {
              ...get().rendering,
              previewObjects: [],
            },
            ui: {
              ...get().ui,
              activeToolId: toolId,
            },
          };
        });
      },
      setCanvasRect: (rect) => {
        set((state) => {
          if (
            state.ui.canvasRect?.width === rect.width &&
            state.ui.canvasRect?.height === rect.height
          ) {
            return state;
          }

          return {
            ui: {
              ...state.ui,
              canvasRect: rect,
            },
          };
        });
      },
      setViewport: (viewport) => {
        set((state) => {
          if (
            state.ui.viewport.zoom === viewport.zoom &&
            state.ui.viewport.pan.x === viewport.pan.x &&
            state.ui.viewport.pan.y === viewport.pan.y
          ) {
            return state;
          }

          return {
            ui: {
              ...state.ui,
              viewport,
            },
          };
        });
      },
      addObjects: (objects) => {
        if (objects.length === 0) {
          return;
        }

        set((state) => {
          const nextById = { ...state.board.objects.byId };
          const nextOrder = [...state.board.objects.order];

          for (const object of objects) {
            nextById[object.id] = object;
            if (!nextOrder.includes(object.id)) {
              nextOrder.push(object.id);
            }
          }

          return {
            board: {
              ...state.board,
              objects: {
                ...state.board.objects,
                byId: nextById,
                order: nextOrder,
              },
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
          nextById[duplicateId] = translateObject(
            {
              ...object,
              id: duplicateId,
            },
            {
              x: 2,
              y: 2,
            },
          );
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
      updateObjects: (objectIds, updater) => {
        set((state) => {
          let changed = false;
          const nextById = { ...state.board.objects.byId };

          for (const objectId of objectIds) {
            const object = nextById[objectId];
            if (!object) {
              continue;
            }

            const nextObject = updater(object);
            if (nextObject === object) {
              continue;
            }

            changed = true;
            nextById[objectId] = nextObject;
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
            nextById[objectId] = translateObject(object, delta);
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
      registerObjectHitTester: (objectType, hitTester) => {
        set((state) => {
          if (state.rendering.objectHitTesters[objectType] === hitTester) {
            return state;
          }

          return {
            rendering: {
              ...state.rendering,
              objectHitTesters: {
                ...state.rendering.objectHitTesters,
                [objectType]: hitTester,
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
