import { createCanvasRenderer } from "../../rendering/canvas/create-canvas-renderer";
import type { CanvasRenderer } from "../../rendering/canvas/types";
import { createToolApi } from "./create-tool-api";
import { createBoardEditorController } from "./board-editor-controller";
import type { BoardEditorStore } from "../store/board-editor-store";
import type { ToolDefinition } from "../tools/types";
import { DEFAULT_VIEWPORT, getViewportToFitSurface } from "./viewport-utils";
import {
  deleteSelectedObjects,
  setSelectedObjectIds,
  selectAllObjects,
} from "../../tools/select-tool-actions";
import { getSelectToolState, SELECT_TOOL_ID } from "../../tools/select-tool-state";
import { TEXT_TOOL_ID } from "../../tools/text-tool-state";

export interface BoardEditorRuntime {
  mount: (canvas: HTMLCanvasElement) => void;
  unmount: () => void;
}

export interface CreateBoardEditorRuntimeOptions {
  store: BoardEditorStore;
}

export function createBoardEditorRuntime({
  store,
}: CreateBoardEditorRuntimeOptions): BoardEditorRuntime {
  const controller = createBoardEditorController(store);
  const toolApi = createToolApi(store);
  const renderer: CanvasRenderer = createCanvasRenderer();
  const registeredToolRendererIds = new Set<string>();
  let canvas: HTMLCanvasElement | null = null;
  let frameId: number | null = null;
  let unsubscribe: (() => void) | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let hasAppliedInitialViewportFit = false;

  const registerToolCapabilities = (tool: ToolDefinition | undefined) => {
    if (!tool || registeredToolRendererIds.has(tool.id)) {
      return;
    }

    registeredToolRendererIds.add(tool.id);

    tool.registerCapabilities?.({
      registerObjectRenderer: store.getState().actions.registerObjectRenderer,
      registerObjectHitTester: store.getState().actions.registerObjectHitTester,
      registerOverlayRenderer: store.getState().actions.registerOverlayRenderer,
      registerObjectDefinition:
        store.getState().actions.registerObjectDefinition,
    });
  };

  const syncToolRenderers = () => {
    const { definitions } = store.getState().toolRegistry;

    for (const tool of Object.values(definitions)) {
      registerToolCapabilities(tool);
    }
  };

  const render = () => {
    if (!canvas) {
      return;
    }

    const state = store.getState();
    const overlayItems = Object.values(state.toolRegistry.definitions).flatMap(
      (tool) => tool.getOverlayItems?.(state) ?? [],
    );

    renderer.render({
      canvas,
      board: state.board,
      viewport: state.ui.viewport,
      requestRender,
      previewObjects: state.rendering.previewObjects,
      overlayItems,
      objectRenderers: state.rendering.objectRenderers,
      overlayRenderers: state.rendering.overlayRenderers,
    });
  };

  const syncCanvasRect = () => {
    if (!canvas) {
      return;
    }

    const canvasRect = {
      width: Math.max(1, Math.floor(canvas.clientWidth)),
      height: Math.max(1, Math.floor(canvas.clientHeight)),
    };
    const state = store.getState();

    state.actions.setCanvasRect(canvasRect);

    if (
      hasAppliedInitialViewportFit ||
      state.ui.viewport.zoom !== DEFAULT_VIEWPORT.zoom ||
      state.ui.viewport.pan.x !== DEFAULT_VIEWPORT.pan.x ||
      state.ui.viewport.pan.y !== DEFAULT_VIEWPORT.pan.y
    ) {
      return;
    }

    state.actions.setViewport(
      getViewportToFitSurface({
        surface: state.board.surface,
        canvasRect,
      }),
    );
    hasAppliedInitialViewportFit = true;
  };

  const requestRender = () => {
    if (frameId !== null) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      render();
    });
  };

  const createPointerInput = (event: PointerEvent) => {
    if (!canvas) {
      return null;
    }

    return {
      clientPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      pointerId: event.pointerId,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      canvasRect: canvas.getBoundingClientRect(),
    };
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!canvas) {
      return;
    }

    if (store.getState().ui.activeToolId !== TEXT_TOOL_ID) {
      canvas.focus();
    }
    canvas.setPointerCapture(event.pointerId);
    const input = createPointerInput(event);
    if (!input) {
      return;
    }

    controller.dispatchPointerEvent("onPointerDown", input);
  };

  const onPointerMove = (event: PointerEvent) => {
    const input = createPointerInput(event);
    if (!input) {
      return;
    }

    controller.dispatchPointerEvent("onPointerMove", input);
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (!canvas) {
      return;
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      return;
    }

    store.getState().actions.clearPreviewObjects();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!canvas) {
      return;
    }

    const input = createPointerInput(event);
    if (!input) {
      return;
    }

    controller.dispatchPointerEvent("onPointerUp", input);
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const beginEditingSelection = (
    input:
      | {
          clientX: number;
          clientY: number;
        }
      | undefined,
  ) => {
    const state = store.getState();

    if (state.ui.activeToolId !== SELECT_TOOL_ID || !state.ui.canvasRect) {
      return;
    }

    const selectState = getSelectToolState(state.toolState);
    const selectedObjects = selectState.selectedObjectIds
      .map((objectId) => state.board.objects.byId[objectId])
      .filter((object) => Boolean(object));

    if (selectedObjects.length !== 1) {
      return;
    }

    const object = selectedObjects[0]!;
    const definition = state.objectRegistry.definitions[object.type];

    if (!definition?.beginEditing) {
      return;
    }

    if (input) {
      const pointerEvent = controller.createToolPointerEvent({
        clientPoint: {
          x: input.clientX,
          y: input.clientY,
        },
        pointerId: -1,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        canvasRect: canvas?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
          width: state.ui.canvasRect.width,
          height: state.ui.canvasRect.height,
        },
      });

      if (pointerEvent.targetObjectId !== object.id) {
        return;
      }
    }

    setSelectedObjectIds(toolApi, [object.id]);
    definition.beginEditing({
      object,
      state,
      canvasRect: state.ui.canvasRect,
    });
  };

  const onDoubleClick = (event: MouseEvent) => {
    beginEditingSelection({
      clientX: event.clientX,
      clientY: event.clientY,
    });
  };

  const onWheel = (event: WheelEvent) => {
    if (!canvas) {
      return;
    }

    const handled = controller.dispatchWheelEvent({
      clientPoint: {
        x: event.clientX,
        y: event.clientY,
      },
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      canvasRect: canvas.getBoundingClientRect(),
    });

    if (handled) {
      event.preventDefault();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      deleteSelectedObjects(toolApi);
      event.preventDefault();
      return;
    }

    if (
      event.key === "Enter" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey
    ) {
      beginEditingSelection(undefined);
      event.preventDefault();
      return;
    }

    const isModifierPressed = event.metaKey || event.ctrlKey;

    if (!isModifierPressed || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "z") {
      if (event.shiftKey) {
        store.getState().actions.redo();
      } else {
        store.getState().actions.undo();
      }
      event.preventDefault();
      return;
    }

    if (key === "y" && !event.shiftKey) {
      store.getState().actions.redo();
      event.preventDefault();
      return;
    }

    if (key === "a" && !event.shiftKey) {
      selectAllObjects(toolApi);
      event.preventDefault();
    }
  };

  return {
    mount: (nextCanvas) => {
      if (canvas === nextCanvas) {
        requestRender();
        return;
      }

      if (canvas) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("dblclick", onDoubleClick);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("keydown", onKeyDown);
      }

      resizeObserver?.disconnect();
      unsubscribe?.();

      canvas = nextCanvas;
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerleave", onPointerLeave);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("dblclick", onDoubleClick);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      canvas.addEventListener("keydown", onKeyDown);

      unsubscribe = store.subscribe(() => {
        syncToolRenderers();
        requestRender();
      });

      resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              syncCanvasRect();
              requestRender();
            });
      resizeObserver?.observe(canvas);

      syncCanvasRect();
      syncToolRenderers();
      requestRender();
    },
    unmount: () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }

      resizeObserver?.disconnect();
      resizeObserver = null;
      unsubscribe?.();
      unsubscribe = null;

      if (canvas) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("dblclick", onDoubleClick);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("keydown", onKeyDown);
      }

      canvas = null;
    },
  };
}
