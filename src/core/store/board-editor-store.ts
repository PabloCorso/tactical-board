import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  Board,
  Document,
  Point,
  Shape,
  ShapeId,
  ToolId,
} from "../board/types";
import type { BoardEditorState } from "../editor/types";
import { moveObjectIdsToLayerBoundary } from "../board/object-order";
import { moveBoardObject } from "../objects/object-behaviors";
import type { ShapeDefinition, ShapeRegistry } from "../objects/types";
import type {
  ToolApi,
  ToolCapabilityRegistrationApi,
  ToolDefinition,
  ToolRegistration,
  ToolRegistry,
} from "../tools/types";
import type {
  CanvasObjectHitTesterRegistry,
  CanvasObjectRendererRegistry,
  CanvasOverlayRendererRegistry,
} from "../rendering/canvas/types";

const MAX_HISTORY_ENTRIES = 100;

type CreateEditorStoreBaseOptions = {
  tools?: ToolRegistration[];
  initialToolId?: ToolId;
  objectRenderers?: CanvasObjectRendererRegistry;
  objectHitTesters?: CanvasObjectHitTesterRegistry;
  overlayRenderers?: CanvasOverlayRendererRegistry;
  objectDefinitions?: ShapeDefinition[];
};

export type CreateEditorStoreOptions = CreateEditorStoreBaseOptions & {
  initialDocument: Document;
};

// Compatibility options kept for current Board-facing callers.
export type CreateBoardEditorStoreOptions = CreateEditorStoreBaseOptions & {
  initialBoard: Board;
};

export type BoardEditorStore = StoreApi<BoardEditorState>;
export type EditorStore = BoardEditorStore;

function instantiateTool(tool: ToolRegistration): ToolDefinition {
  return typeof tool === "function" ? new tool() : tool;
}

function createToolRegistry(tools: ToolRegistration[] = []): ToolRegistry {
  return {
    definitions: Object.fromEntries(
      tools.map(instantiateTool).map((tool) => [tool.id, tool]),
    ),
  };
}

function createObjectRegistry(
  objectDefinitions: ShapeDefinition[] = [],
): ShapeRegistry {
  return {
    definitions: Object.fromEntries(
      objectDefinitions.map((definition) => [definition.type, definition]),
    ),
  };
}

function createDuplicatedObjectId(
  objectId: ShapeId,
  existingObjects: Record<ShapeId, Shape>,
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

function translateObject(
  state: Pick<BoardEditorState, "objectRegistry">,
  object: Shape,
  delta: Point,
): Shape {
  return moveBoardObject(state, object, delta);
}

function createHistoryEntry(
  state: Pick<BoardEditorState, "board" | "selection">,
) {
  return {
    board: state.board,
    selectedObjectIds: state.selection.selectedObjectIds,
  };
}

function pushHistoryEntry(
  history: BoardEditorState["history"]["past"],
  entry: BoardEditorState["history"]["past"][number],
) {
  if (history.length >= MAX_HISTORY_ENTRIES) {
    return [...history.slice(1), entry];
  }

  return [...history, entry];
}

function applyHistoryEntry(
  state: BoardEditorState,
  entry: BoardEditorState["history"]["past"][number],
) {
  return {
    board: entry.board,
    selection: {
      selectedObjectIds: [...entry.selectedObjectIds],
    },
    toolState: Object.fromEntries(
      Object.entries(state.toolState).map(([toolId, value]) => {
        if (!value || typeof value !== "object" || !("interaction" in value)) {
          return [toolId, value];
        }

        return [
          toolId,
          {
            ...value,
            interaction: undefined,
          },
        ];
      }),
    ),
  };
}

function normalizeSelectedObjectIds(
  state: Pick<BoardEditorState, "board">,
  objectIds: ShapeId[],
) {
  const seen = new Set<ShapeId>();
  const selectedObjectIds: ShapeId[] = [];

  for (const objectId of objectIds) {
    if (seen.has(objectId) || !state.board.objects.byId[objectId]) {
      continue;
    }

    seen.add(objectId);
    selectedObjectIds.push(objectId);
  }

  return selectedObjectIds;
}

function selectedObjectIdsEqual(a: ShapeId[], b: ShapeId[]) {
  return (
    a.length === b.length && a.every((objectId, index) => objectId === b[index])
  );
}

export function createEditorStore({
  initialDocument,
  tools = [],
  initialToolId,
  objectRenderers = {},
  objectHitTesters = {},
  overlayRenderers = {},
  objectDefinitions = [],
}: CreateEditorStoreOptions): EditorStore {
  const toolRegistry = createToolRegistry(tools);
  const registeredTools = Object.values(toolRegistry.definitions);
  const objectRegistry = createObjectRegistry(objectDefinitions);
  let historyBatchDepth = 0;
  let hasRecordedHistoryForActiveBatch = false;
  const recordHistoryForBoardChange = (
    state: BoardEditorState,
  ): BoardEditorState["history"] => {
    if (historyBatchDepth > 0 && hasRecordedHistoryForActiveBatch) {
      return {
        ...state.history,
        future: [],
      };
    }

    if (historyBatchDepth > 0) {
      hasRecordedHistoryForActiveBatch = true;
    }

    return {
      past: pushHistoryEntry(state.history.past, createHistoryEntry(state)),
      future: [],
    };
  };
  const activeToolId =
    initialToolId && toolRegistry.definitions[initialToolId]
      ? initialToolId
      : (registeredTools[0]?.id ?? initialToolId ?? "");

  const store = createStore<BoardEditorState>((set, get) => ({
    board: initialDocument,
    history: {
      past: [],
      future: [],
    },
    ui: {
      activeToolId,
      defaultToolId: activeToolId,
      canvasRect: undefined,
      viewport: {
        pan: { x: 0, y: 0 },
        zoom: 1,
      },
    },
    selection: {
      selectedObjectIds: [],
    },
    rendering: {
      previewObjects: [],
      objectRenderers: { ...objectRenderers },
      objectHitTesters: { ...objectHitTesters },
      overlayRenderers: { ...overlayRenderers },
    },
    objectRegistry,
    toolState: {},
    toolRegistry,
    actions: {
      beginHistoryBatch: () => {
        historyBatchDepth += 1;
      },
      endHistoryBatch: () => {
        historyBatchDepth = Math.max(0, historyBatchDepth - 1);

        if (historyBatchDepth === 0) {
          hasRecordedHistoryForActiveBatch = false;
        }
      },
      undo: () => {
        set((state) => {
          historyBatchDepth = 0;
          hasRecordedHistoryForActiveBatch = false;
          const previousEntry = state.history.past.at(-1);

          if (!previousEntry) {
            return state;
          }

          return {
            ...applyHistoryEntry(state, previousEntry),
            history: {
              past: state.history.past.slice(0, -1),
              future: [createHistoryEntry(state), ...state.history.future],
            },
          };
        });
      },
      redo: () => {
        set((state) => {
          historyBatchDepth = 0;
          hasRecordedHistoryForActiveBatch = false;
          const nextEntry = state.history.future[0];

          if (!nextEntry) {
            return state;
          }

          return {
            ...applyHistoryEntry(state, nextEntry),
            history: {
              past: pushHistoryEntry(
                state.history.past,
                createHistoryEntry(state),
              ),
              future: state.history.future.slice(1),
            },
          };
        });
      },
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
            beginHistoryBatch: actions.beginHistoryBatch,
            endHistoryBatch: actions.endHistoryBatch,
            addObjects: actions.addObjects,
            bringObjectsToFront: actions.bringObjectsToFront,
            moveObjects: actions.moveObjects,
            duplicateObjects: actions.duplicateObjects,
            deleteObjects: actions.deleteObjects,
            sendObjectsToBack: actions.sendObjectsToBack,
            setSurface: actions.setSurface,
            updateObjects: actions.updateObjects,
            setPreviewObjects: actions.setPreviewObjects,
            clearPreviewObjects: actions.clearPreviewObjects,
            panViewport: actions.panViewport,
            setSelectedObjectIds: actions.setSelectedObjectIds,
            clearSelection: actions.clearSelection,
            setToolState: actions.setToolState,
            clearToolState: actions.clearToolState,
            registerObjectRenderer: actions.registerObjectRenderer,
            registerObjectHitTester: actions.registerObjectHitTester,
            registerOverlayRenderer: actions.registerOverlayRenderer,
            registerObjectDefinition: actions.registerObjectDefinition,
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

          const nextBoard = {
            ...state.board,
            objects: {
              ...state.board.objects,
              byId: nextById,
              order: nextOrder,
            },
          };

          return {
            board: nextBoard,
            history: recordHistoryForBoardChange(state),
          };
        });
      },
      bringObjectsToFront: (objectIds) => {
        set((state) => {
          const nextOrder = moveObjectIdsToLayerBoundary(
            state.board,
            objectIds,
            "front",
          );

          if (
            nextOrder.length === state.board.objects.order.length &&
            nextOrder.every(
              (objectId, index) =>
                objectId === state.board.objects.order[index],
            )
          ) {
            return state;
          }

          const nextBoard = {
            ...state.board,
            objects: {
              ...state.board.objects,
              order: nextOrder,
            },
          };

          return {
            board: nextBoard,
            history: recordHistoryForBoardChange(state),
          };
        });
      },
      duplicateObjects: (objectIds) => {
        const state = get();
        const nextById = { ...state.board.objects.byId };
        const nextOrder = [...state.board.objects.order];
        const duplicateIds: ShapeId[] = [];

        for (const objectId of objectIds) {
          const object = nextById[objectId];
          if (!object) {
            continue;
          }

          const duplicateId = createDuplicatedObjectId(objectId, nextById);
          duplicateIds.push(duplicateId);
          nextById[duplicateId] = translateObject(
            state,
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

        set((currentState) => {
          const nextBoard = {
            ...currentState.board,
            objects: {
              ...currentState.board.objects,
              byId: nextById,
              order: nextOrder,
            },
          };

          return {
            board: nextBoard,
            history: recordHistoryForBoardChange(currentState),
          };
        });

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

          const nextBoard = {
            ...state.board,
            objects: {
              ...state.board.objects,
              byId: nextById,
              order: state.board.objects.order.filter(
                (objectId) => !objectIdsToDelete.has(objectId),
              ),
            },
          };

          return {
            board: nextBoard,
            selection: {
              selectedObjectIds: state.selection.selectedObjectIds.filter(
                (objectId) => !objectIdsToDelete.has(objectId),
              ),
            },
            history: recordHistoryForBoardChange(state),
          };
        });
      },
      sendObjectsToBack: (objectIds) => {
        set((state) => {
          const nextOrder = moveObjectIdsToLayerBoundary(
            state.board,
            objectIds,
            "back",
          );

          if (
            nextOrder.length === state.board.objects.order.length &&
            nextOrder.every(
              (objectId, index) =>
                objectId === state.board.objects.order[index],
            )
          ) {
            return state;
          }

          const nextBoard = {
            ...state.board,
            objects: {
              ...state.board.objects,
              order: nextOrder,
            },
          };

          return {
            board: nextBoard,
            history: recordHistoryForBoardChange(state),
          };
        });
      },
      setSurface: (surface) => {
        set((state) => {
          if (state.board.surface === surface) {
            return state;
          }

          const nextBoard = {
            ...state.board,
            surface,
          };

          return {
            board: nextBoard,
            history: recordHistoryForBoardChange(state),
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

          const nextBoard = {
            ...state.board,
            objects: {
              ...state.board.objects,
              byId: nextById,
            },
          };

          return {
            board: nextBoard,
            history: recordHistoryForBoardChange(state),
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
      setSelectedObjectIds: (objectIds) => {
        set((state) => {
          const selectedObjectIds = normalizeSelectedObjectIds(
            state,
            objectIds,
          );

          if (
            selectedObjectIdsEqual(
              state.selection.selectedObjectIds,
              selectedObjectIds,
            )
          ) {
            return state;
          }

          return {
            selection: {
              selectedObjectIds,
            },
          };
        });
      },
      clearSelection: () => {
        set((state) => {
          if (state.selection.selectedObjectIds.length === 0) {
            return state;
          }

          return {
            selection: {
              selectedObjectIds: [],
            },
          };
        });
      },
      moveObjects: (objectIds: ShapeId[], delta: Point) => {
        set((state) => {
          let changed = false;
          const nextById = { ...state.board.objects.byId };

          for (const objectId of objectIds) {
            const object = nextById[objectId];
            if (!object || object.locked) {
              continue;
            }

            changed = true;
            nextById[objectId] = translateObject(state, object, delta);
          }

          if (!changed) {
            return state;
          }

          const nextBoard = {
            ...state.board,
            objects: {
              ...state.board.objects,
              byId: nextById,
            },
          };

          return {
            board: nextBoard,
            history: recordHistoryForBoardChange(state),
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
      registerObjectDefinition: (definition) => {
        set((state) => {
          if (
            state.objectRegistry.definitions[definition.type] === definition
          ) {
            return state;
          }

          return {
            objectRegistry: {
              definitions: {
                ...state.objectRegistry.definitions,
                [definition.type]: definition,
              },
            },
          };
        });
      },
    },
  }));

  const registrationApi: ToolCapabilityRegistrationApi = {
    registerObjectRenderer: store.getState().actions.registerObjectRenderer,
    registerObjectHitTester: store.getState().actions.registerObjectHitTester,
    registerOverlayRenderer: store.getState().actions.registerOverlayRenderer,
    registerObjectDefinition: store.getState().actions.registerObjectDefinition,
  };

  for (const tool of registeredTools) {
    tool.registerCapabilities?.(registrationApi);
  }

  return store;
}

export function createBoardEditorStore({
  initialBoard,
  ...options
}: CreateBoardEditorStoreOptions): BoardEditorStore {
  return createEditorStore({
    ...options,
    initialDocument: initialBoard,
  });
}
