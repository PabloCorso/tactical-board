import { createCanvasRenderer } from "../rendering/canvas/create-canvas-renderer";
import type { AssetResolver, CanvasRenderer } from "../rendering/canvas/types";
import { createToolApi } from "./create-tool-api";
import { createBoardEditorController } from "./board-editor-controller";
import type { BoardEditorStore } from "../store/board-editor-store";
import type { ToolDefinition } from "../tools/types";
import { resolveBoardEditorFitPadding } from "./fit-padding";
import { DEFAULT_VIEWPORT, getViewportToFitBoard } from "./viewport-utils";

export interface BoardEditorRuntime {
  mount: (canvas: HTMLCanvasElement) => void;
  unmount: () => void;
}

export interface CreateBoardEditorRuntimeOptions {
  assetResolver?: AssetResolver;
  extendBackground?: boolean;
  store: BoardEditorStore;
}

export function createBoardEditorRuntime({
  assetResolver,
  extendBackground = true,
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
  const touchPointers = new Map<
    number,
    {
      clientPoint: { x: number; y: number };
      startedToolInteraction: boolean;
    }
  >();
  let pinchGesture: { previousDistance: number } | null = null;

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

  const getActiveTool = () => {
    const state = store.getState();

    return state.toolRegistry.definitions[state.ui.activeToolId];
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
      extendBackground,
      fitPadding: resolveBoardEditorFitPadding(state),
      requestRender,
      previewObjects: state.rendering.previewObjects,
      overlayItems,
      objectRenderers: state.rendering.objectRenderers,
      overlayRenderers: state.rendering.overlayRenderers,
      assetResolver,
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
      getViewportToFitBoard({
        board: state.board,
        canvasRect,
        fitPadding: resolveBoardEditorFitPadding(state),
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
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      canvasRect: canvas.getBoundingClientRect(),
    };
  };

  const getTouchPointerPair = () => {
    const pointers = [...touchPointers.entries()];

    if (pointers.length < 2) {
      return null;
    }

    return [pointers[0]!, pointers[1]!] as const;
  };

  const getPinchMetrics = () => {
    const pair = getTouchPointerPair();

    if (!pair) {
      return null;
    }

    const [, first] = pair[0];
    const [, second] = pair[1];

    return {
      distance: Math.hypot(
        second.clientPoint.x - first.clientPoint.x,
        second.clientPoint.y - first.clientPoint.y,
      ),
      center: {
        x: (first.clientPoint.x + second.clientPoint.x) / 2,
        y: (first.clientPoint.y + second.clientPoint.y) / 2,
      },
    };
  };

  const finishStartedTouchToolInteractions = () => {
    if (!canvas) {
      return;
    }

    for (const [pointerId, pointer] of touchPointers) {
      if (!pointer.startedToolInteraction) {
        continue;
      }

      controller.dispatchPointerEvent("onPointerUp", {
        clientPoint: pointer.clientPoint,
        pointerId,
        button: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        canvasRect: canvas.getBoundingClientRect(),
      });
      touchPointers.set(pointerId, {
        ...pointer,
        startedToolInteraction: false,
      });
    }
  };

  const beginPinchGesture = () => {
    const metrics = getPinchMetrics();

    if (!metrics) {
      pinchGesture = null;
      return;
    }

    finishStartedTouchToolInteractions();
    pinchGesture = { previousDistance: metrics.distance };
  };

  const updatePinchGesture = () => {
    if (!canvas || !pinchGesture) {
      return false;
    }

    const metrics = getPinchMetrics();

    if (
      !metrics ||
      metrics.distance <= 0 ||
      pinchGesture.previousDistance <= 0
    ) {
      return false;
    }

    controller.dispatchZoomEvent({
      clientPoint: metrics.center,
      canvasRect: canvas.getBoundingClientRect(),
      scale: metrics.distance / pinchGesture.previousDistance,
    });
    pinchGesture = { previousDistance: metrics.distance };
    return true;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!canvas) {
      return;
    }

    if (event.pointerType === "touch") {
      touchPointers.set(event.pointerId, {
        clientPoint: {
          x: event.clientX,
          y: event.clientY,
        },
        startedToolInteraction: false,
      });
      canvas.setPointerCapture(event.pointerId);

      if (touchPointers.size >= 2) {
        beginPinchGesture();
        event.preventDefault();
        return;
      }
    }

    const activeTool = getActiveTool();

    if (activeTool?.shouldPreventContextMenu?.(toolApi)) {
      event.preventDefault();
    }

    if (activeTool?.shouldFocusCanvasOnPointerDown?.(toolApi) !== false) {
      canvas.focus();
    }
    canvas.setPointerCapture(event.pointerId);
    const input = createPointerInput(event);
    if (!input) {
      return;
    }

    controller.dispatchPointerEvent("onPointerDown", input);
    if (event.pointerType === "touch") {
      const pointer = touchPointers.get(event.pointerId);
      if (pointer) {
        touchPointers.set(event.pointerId, {
          ...pointer,
          startedToolInteraction: true,
        });
      }
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const touchPointer = touchPointers.get(event.pointerId);
    if (touchPointer) {
      touchPointers.set(event.pointerId, {
        ...touchPointer,
        clientPoint: {
          x: event.clientX,
          y: event.clientY,
        },
      });

      if (pinchGesture) {
        if (updatePinchGesture()) {
          event.preventDefault();
        }
        return;
      }
    }

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

    if (getActiveTool()?.shouldKeepPreviewOnPointerLeave?.(toolApi)) {
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

    const touchPointer = touchPointers.get(event.pointerId);
    if (!touchPointer || touchPointer.startedToolInteraction) {
      controller.dispatchPointerEvent("onPointerUp", input);
    }
    touchPointers.delete(event.pointerId);
    if (touchPointers.size < 2) {
      pinchGesture = null;
    } else if (pinchGesture) {
      beginPinchGesture();
    }
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

    if (!state.ui.canvasRect) {
      return;
    }

    const selectedObjects = state.selection.selectedObjectIds
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

    toolApi.setSelectedObjectIds([object.id]);
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

  const onContextMenu = (event: MouseEvent) => {
    if (getActiveTool()?.shouldPreventContextMenu?.(toolApi)) {
      event.preventDefault();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (handleEscapeKey()) {
        event.preventDefault();
      }
      return;
    }

    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      const selectedObjectIds = store.getState().selection.selectedObjectIds;

      if (selectedObjectIds.length > 0) {
        toolApi.deleteObjects(selectedObjectIds);
        toolApi.clearSelection();
      }
      event.preventDefault();
      return;
    }

    const activeTool = getActiveTool();
    const toolHandled = activeTool?.onKeyDown?.(
      {
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
      },
      toolApi,
    );

    if (toolHandled) {
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
      toolApi.setSelectedObjectIds(store.getState().board.objects.order);
      event.preventDefault();
    }
  };

  const handleEscapeKey = () => {
    const state = store.getState();
    const { activeToolId, defaultToolId } = state.ui;
    const activeTool = state.toolRegistry.definitions[activeToolId];

    if (activeTool?.onEscapeKey?.(toolApi)) {
      return true;
    }

    if (activeToolId !== defaultToolId) {
      store.getState().actions.setActiveTool(defaultToolId);
      return true;
    }

    if (state.selection.selectedObjectIds.length > 0) {
      toolApi.clearSelection();
      return true;
    }

    return false;
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
        canvas.removeEventListener("contextmenu", onContextMenu);
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
      canvas.addEventListener("contextmenu", onContextMenu);
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
      touchPointers.clear();
      pinchGesture = null;

      if (canvas) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("dblclick", onDoubleClick);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("contextmenu", onContextMenu);
        canvas.removeEventListener("keydown", onKeyDown);
      }

      canvas = null;
    },
  };
}
