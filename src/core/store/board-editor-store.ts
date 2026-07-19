import { createStore, type StoreApi } from "zustand/vanilla";
import type { Board, Point, Shape, ShapeId, ToolId } from "../board/types";
import type { BoardEditorState } from "../editor/types";
import { resolveBoardEditorFitPadding } from "../editor/fit-padding";
import {
  constrainViewportToBoard,
  getContainedViewportForBoardCanvasResize,
  getViewportForBoardCanvasResize,
  getViewportToFitBoard,
} from "../editor/viewport-utils";
import {
  DEFAULT_OBJECT_ORDER_RANK,
  moveObjectIdsToBoundary,
} from "../board/object-order";
import { moveBoardObject } from "../objects/object-behaviors";
import {
  createObjectRegistry,
  type ObjectDefinition,
  type ObjectRegistry,
} from "../objects/types";
import type {
  ToolCapabilityRegistrationApi,
  ToolDefinition,
  ToolRegistry,
} from "../tools/types";
import type { CanvasOverlayRendererRegistry } from "../rendering/canvas/types";
import { createToolApi } from "../editor/create-tool-api";
import {
  createDocumentTransaction,
  normalizeDocument,
  reconcileDocumentSelection,
} from "../editor/document-transaction";

export type CreateBoardEditorStoreOptions = {
  initialBoard: Board;
  tools?: ToolDefinition[];
  initialToolId?: ToolId;
  fitPadding?: BoardEditorState["ui"]["fitPadding"];
  navigationMode?: BoardEditorState["ui"]["navigationMode"];
  zoomScaleLimits?: BoardEditorState["ui"]["zoomScaleLimits"];
  overlayRenderers?: CanvasOverlayRendererRegistry;
  objectDefinitions?: ObjectDefinition[];
};

export type BoardEditorStore = StoreApi<BoardEditorState>;

function createToolRegistry(tools: ToolDefinition[] = []): ToolRegistry {
  return {
    definitions: Object.fromEntries(tools.map((tool) => [tool.id, tool])),
  };
}

function getDefaultObjectOrderRank(
  objectRegistry: ObjectRegistry,
  object: Shape,
) {
  const rank = objectRegistry.definitions[object.type]?.defaultOrderRank;
  return typeof rank === "number" && Number.isFinite(rank)
    ? rank
    : DEFAULT_OBJECT_ORDER_RANK;
}

function insertObjectIdAtDefaultOrder({
  byId,
  object,
  objectRegistry,
  order,
}: {
  byId: Record<ShapeId, Shape>;
  object: Shape;
  objectRegistry: ObjectRegistry;
  order: ShapeId[];
}) {
  const targetRank = getDefaultObjectOrderRank(objectRegistry, object);
  let lastPeerIndex = -1;

  for (let index = 0; index < order.length; index += 1) {
    const existingObject = byId[order[index]];

    if (
      existingObject &&
      getDefaultObjectOrderRank(objectRegistry, existingObject) === targetRank
    ) {
      lastPeerIndex = index;
    }
  }

  if (lastPeerIndex >= 0) {
    order.splice(lastPeerIndex + 1, 0, object.id);
    return;
  }

  const firstHigherRankIndex = order.findIndex((objectId) => {
    const existingObject = byId[objectId];
    return (
      existingObject !== undefined &&
      getDefaultObjectOrderRank(objectRegistry, existingObject) > targetRank
    );
  });

  order.splice(
    firstHigherRankIndex >= 0 ? firstHigherRankIndex : order.length,
    0,
    object.id,
  );
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

function clearToolInteractions(toolState: BoardEditorState["toolState"]) {
  return Object.fromEntries(
    Object.entries(toolState).map(([toolId, value]) => {
      if (!value || typeof value !== "object" || !("interaction" in value)) {
        return [toolId, value];
      }

      return [toolId, { ...value, interaction: undefined }];
    }),
  );
}

export function createBoardEditorStore({
  initialBoard,
  tools = [],
  initialToolId,
  fitPadding,
  navigationMode = "free",
  zoomScaleLimits,
  overlayRenderers = {},
  objectDefinitions = [],
}: CreateBoardEditorStoreOptions): BoardEditorStore {
  const toolRegistry = createToolRegistry(tools);
  const registeredTools = Object.values(toolRegistry.definitions);
  const objectRegistry = createObjectRegistry(objectDefinitions);
  const documentTransaction = createDocumentTransaction();
  const commitDocumentChange = (
    state: BoardEditorState,
    update: (board: Board) => Board,
  ) => documentTransaction.commit(state, update) ?? state;
  const activeToolId =
    initialToolId && toolRegistry.definitions[initialToolId]
      ? initialToolId
      : (registeredTools[0]?.id ?? initialToolId ?? "");
  const constrainViewport = (
    state: BoardEditorState,
    viewport: BoardEditorState["ui"]["viewport"],
  ) => {
    if (state.ui.navigationMode !== "contained" || !state.ui.canvasRect) {
      return viewport;
    }

    return constrainViewportToBoard({
      board: state.board,
      canvasRect: state.ui.canvasRect,
      viewport,
      fitPadding: resolveBoardEditorFitPadding(state),
    });
  };

  const store = createStore<BoardEditorState>((set, get) => ({
    board: normalizeDocument(initialBoard),
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
      fitPadding,
      navigationMode,
      zoomScaleLimits,
    },
    selection: {
      selectedObjectIds: [],
    },
    rendering: {
      previewObjects: [],
      overlayRenderers: { ...overlayRenderers },
    },
    objectRegistry,
    toolState: {},
    toolRegistry,
    actions: {
      beginHistoryBatch: () => {
        documentTransaction.beginHistoryBatch();
      },
      endHistoryBatch: () => {
        documentTransaction.endHistoryBatch();
      },
      undo: () => {
        set((state) => {
          const result = documentTransaction.undo(state);

          return result
            ? { ...result, toolState: clearToolInteractions(state.toolState) }
            : state;
        });
      },
      redo: () => {
        set((state) => {
          const result = documentTransaction.redo(state);

          return result
            ? { ...result, toolState: clearToolInteractions(state.toolState) }
            : state;
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

          const toolApi = createToolApi(store);
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
      resetTool: () => {
        const state = get();
        state.actions.setActiveTool(state.ui.defaultToolId);
      },
      setCanvasRect: (rect) => {
        set((state) => {
          const previousCanvasRect = state.ui.canvasRect;

          if (
            previousCanvasRect?.width === rect.width &&
            previousCanvasRect?.height === rect.height
          ) {
            return state;
          }

          const nextViewport = !previousCanvasRect
            ? getViewportToFitBoard({
                board: state.board,
                canvasRect: rect,
                fitPadding: resolveBoardEditorFitPadding(state),
              })
            : state.ui.navigationMode === "contained"
              ? getContainedViewportForBoardCanvasResize({
                  board: state.board,
                  previousCanvasRect,
                  nextCanvasRect: rect,
                  viewport: state.ui.viewport,
                  fitPadding: resolveBoardEditorFitPadding(state),
                })
              : getViewportForBoardCanvasResize({
                  board: state.board,
                  previousCanvasRect,
                  nextCanvasRect: rect,
                  viewport: state.ui.viewport,
                  fitPadding: resolveBoardEditorFitPadding(state),
                });

          return {
            ui: { ...state.ui, canvasRect: rect, viewport: nextViewport },
          };
        });
      },
      setViewport: (viewport) => {
        set((state) => {
          const nextViewport = constrainViewport(state, viewport);

          if (
            state.ui.viewport.zoom === nextViewport.zoom &&
            state.ui.viewport.pan.x === nextViewport.pan.x &&
            state.ui.viewport.pan.y === nextViewport.pan.y
          ) {
            return state;
          }

          return {
            ui: {
              ...state.ui,
              viewport: nextViewport,
            },
          };
        });
      },
      addObjects: (objects) => {
        if (objects.length === 0) {
          return;
        }

        set((state) => {
          const addedObjectIds = new Set<ShapeId>();

          for (const object of objects) {
            if (
              state.board.objects.byId[object.id] ||
              addedObjectIds.has(object.id)
            ) {
              throw new Error(`Cannot add duplicate Object id: ${object.id}`);
            }
            addedObjectIds.add(object.id);
          }

          const nextById = { ...state.board.objects.byId };
          const nextOrder = [...state.board.objects.order];

          for (const object of objects) {
            nextById[object.id] = object;
            if (!nextOrder.includes(object.id)) {
              insertObjectIdAtDefaultOrder({
                byId: nextById,
                object,
                objectRegistry: state.objectRegistry,
                order: nextOrder,
              });
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

          return commitDocumentChange(state, () => nextBoard);
        });
      },
      bringObjectsToFront: (objectIds) => {
        set((state) => {
          const nextOrder = moveObjectIdsToBoundary(
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

          return commitDocumentChange(state, () => nextBoard);
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
          const duplicatedObject = translateObject(
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
          nextById[duplicateId] = duplicatedObject;
          insertObjectIdAtDefaultOrder({
            byId: nextById,
            object: duplicatedObject,
            objectRegistry: state.objectRegistry,
            order: nextOrder,
          });
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

          return commitDocumentChange(currentState, () => nextBoard);
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

          return commitDocumentChange(state, () => nextBoard);
        });
      },
      sendObjectsToBack: (objectIds) => {
        set((state) => {
          const nextOrder = moveObjectIdsToBoundary(
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

          return commitDocumentChange(state, () => nextBoard);
        });
      },
      setFrame: (frame) => {
        set((state) => {
          if (state.board.frame === frame) {
            return state;
          }

          const nextBoard = {
            ...state.board,
            frame,
          };

          return commitDocumentChange(state, () => nextBoard);
        });
      },
      updateBoard: (updater) => {
        set((state) => commitDocumentChange(state, updater));
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

          return commitDocumentChange(state, () => nextBoard);
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
            viewport: constrainViewport(state, {
              ...state.ui.viewport,
              pan: {
                x: state.ui.viewport.pan.x + delta.x,
                y: state.ui.viewport.pan.y + delta.y,
              },
            }),
          },
        }));
      },
      setSelectedObjectIds: (objectIds) => {
        set((state) => {
          const selection = reconcileDocumentSelection(state.board, objectIds);

          if (
            selection.selectedObjectIds.length ===
              state.selection.selectedObjectIds.length &&
            selection.selectedObjectIds.every(
              (objectId, index) =>
                objectId === state.selection.selectedObjectIds[index],
            )
          ) {
            return state;
          }

          return { selection };
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
            if (!object) {
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

          return commitDocumentChange(state, () => nextBoard);
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

  const registrationApi: ToolCapabilityRegistrationApi = {
    registerOverlayRenderer: store.getState().actions.registerOverlayRenderer,
  };

  for (const tool of registeredTools) {
    tool.registerCapabilities?.(registrationApi);
  }

  return store;
}
