import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardEditor,
  BoardEditorArrowSelectionToolbar,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorLabelsProvider,
  BoardEditorEquipmentToolControl,
  BoardEditorFrameVariantDefaultsToolbar,
  BoardEditorFrameVariantToolControl,
  BoardEditorHandToolControl,
  BoardEditorPlayerToolControl,
  BoardEditorProvider,
  BoardEditorSecondaryToolbar,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorSelectToolControl,
  BoardEditorTextToolControl,
  BoardEditorToolbarDockProvider,
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  BoardEditorToolbarDock,
  BoardViewerCanvas,
  BoardPrimaryToolbar,
  BOARD_ARROW_DEFAULTS,
  basketballTheme,
  createBasketballBoard,
  createBasketballTools,
  createBoardEditorStore,
  createFootballBoard,
  createFootballTools,
  createFootballPitch,
  FOOTBALL_PITCH_OPTIONS,
  FOOTBALL_PITCH_TOOL_ID,
  footballTheme,
  footballThemeAdapters,
  getFootballObjectRenderers,
  getBasketballObjectRenderers,
  getFootballPitchVariant,
} from "./";
import {
  ARROW_OBJECT_TYPE,
  createArrowObject,
} from "../core/objects/arrow-object";
import { ARROW_TOOL_ID } from "../core/tools/arrow-tool-state";
import { EQUIPMENT_OBJECT_TYPE } from "../core/objects/equipment-object";
import { PLAYER_OBJECT_TYPE } from "../core/objects/player-object";
import { SHAPE_OBJECT_TYPE } from "../core/objects/shape-object";
import { TEXT_OBJECT_TYPE } from "../core/objects/text-object";

describe("React public frame", () => {
  it("keeps the editor canvas focusable without the browser focus outline", () => {
    const board = createFootballBoard({ id: "canvas-focus-board" });
    const store = createBoardEditorStore({
      initialBoard: board,
      tools: createFootballTools(),
    });
    const markup = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(BoardEditorCanvas),
      ),
    );

    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain("outline-none");
  });

  it("keeps focus-ring padding inside scrollable toolbar content", () => {
    const toolbarMarkup = renderToString(
      createElement(
        BoardEditorToolbar,
        { density: "compact" },
        createElement(BoardEditorToolbarButton, {
          "aria-label": "Select",
          tooltip: "Select",
        }),
      ),
    );

    expect(toolbarMarkup).toContain("overflow-auto");
    expect(toolbarMarkup).toContain("p-0.5");
  });

  it("uses the accent active state for primary toolbar tool buttons", () => {
    const board = createFootballBoard({ id: "primary-toolbar-active-board" });
    const store = createBoardEditorStore({
      initialBoard: board,
      initialToolId: FOOTBALL_PITCH_TOOL_ID,
      tools: createFootballTools(),
    });
    const footballPitchFrameOptions = FOOTBALL_PITCH_OPTIONS.map((option) => ({
      ...option,
      createFrame: () => createFootballPitch(option.value),
    }));
    const primaryToolbarMarkup = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(
          BoardPrimaryToolbar,
          null,
          createElement(BoardEditorFrameVariantToolControl, {
            toolId: FOOTBALL_PITCH_TOOL_ID,
            options: footballPitchFrameOptions,
            getValue: getFootballPitchVariant,
          }),
        ),
      ),
    );
    const regularToolbarMarkup = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(
          BoardEditorToolbar,
          null,
          createElement(BoardEditorFrameVariantToolControl, {
            toolId: FOOTBALL_PITCH_TOOL_ID,
            options: footballPitchFrameOptions,
            getValue: getFootballPitchVariant,
          }),
        ),
      ),
    );

    expect(primaryToolbarMarkup).toContain("bg-tb-accent");
    expect(primaryToolbarMarkup).toContain(
      "[--tb-toolbar-icon-primary:var(--tb-text-on-accent)]",
    );
    expect(regularToolbarMarkup).not.toContain("bg-tb-accent");
    expect(regularToolbarMarkup).toContain("border-tb-neutral-soft-active");
  });

  it("groups arrow head and line controls in the selection toolbar", () => {
    const board = createFootballBoard({ id: "arrow-toolbar-board" });
    const store = createBoardEditorStore({
      initialBoard: board,
      tools: createFootballTools(),
    });
    const arrow = createArrowObject({
      id: "arrow-toolbar-arrow",
      color: "#111827",
      kind: "straight",
      lineStyle: "solid",
      start: { x: 0, y: 0 },
      end: { x: 80, y: 40 },
      startHead: "none",
      endHead: "triangle",
    });
    const markup = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(BoardEditorArrowSelectionToolbar, {
          selectedObject: arrow,
          toolbarLeft: 100,
          toolbarTop: 80,
          toolbarBottom: 120,
          viewportWidth: 400,
          viewportHeight: 300,
        }),
      ),
    );
    const bodyIndex = markup.indexOf('aria-label="Arrow body style"');
    const leftHeadIndex = markup.indexOf('aria-label="Arrow left head"');
    const lineIndex = markup.indexOf('aria-label="Arrow line style"');
    const rightHeadIndex = markup.indexOf('aria-label="Arrow right head"');

    expect(leftHeadIndex).toBeGreaterThan(-1);
    expect(bodyIndex).toBeGreaterThan(leftHeadIndex);
    expect(rightHeadIndex).toBeGreaterThan(bodyIndex);
    expect(lineIndex).toBeGreaterThan(rightHeadIndex);
    expect(markup.match(/role="separator"/g)?.length).toBe(2);
  });

  it("lets consumers override built-in editor labels", () => {
    const board = createFootballBoard({ id: "translated-labels-board" });
    const store = createBoardEditorStore({
      initialBoard: board,
      tools: createFootballTools(),
    });
    const markup = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(
          BoardEditorLabelsProvider,
          {
            labels: {
              canvasToolbar: {
                zoomOut: "Alejar",
              },
              selectionActions: {
                moreActions: "Mas acciones",
              },
            },
          },
          createElement(BoardEditorCanvasToolbar),
          createElement(
            BoardEditorToolbar,
            null,
            createElement(BoardEditorPlayerToolControl),
          ),
        ),
      ),
    );

    expect(markup).toContain('aria-label="Alejar"');
    expect(markup).toContain('aria-label="Player"');
  });

  it("preserves caller-owned tool and preset labels", () => {
    const board = createFootballBoard({ id: "caller-labels-board" });
    const customToolStore = createBoardEditorStore({
      initialBoard: board,
      tools: [{ id: "select", label: "Registered select" }],
    });
    const store = createBoardEditorStore({
      initialBoard: board,
      initialToolId: ARROW_TOOL_ID,
      tools: createFootballTools(),
    });

    const markup = renderToString(
      createElement(
        BoardEditorProvider,
        {
          labels: {
            canvasToolbar: {
              undo: "Deshacer",
            },
          },
          store,
        },
        createElement(
          BoardEditorProvider,
          {
            labels: {
              canvasToolbar: {
                undo: "Deshacer",
              },
            },
            store: customToolStore,
          },
          createElement(
            BoardEditorToolbar,
            null,
            createElement(BoardEditorSelectToolControl),
          ),
        ),
        createElement(
          BoardEditorToolbar,
          null,
          createElement(BoardEditorSelectToolControl, {
            label: "Custom select",
          }),
        ),
        createElement(BoardEditorSecondaryToolbar, {
          arrowDefaults: [
            {
              ...BOARD_ARROW_DEFAULTS[1],
              label: "Custom run",
            },
          ],
        }),
      ),
    );

    expect(markup).toContain('aria-label="Registered select"');
    expect(markup).toContain('aria-label="Custom select"');
    expect(markup).toContain('aria-label="Custom run"');
  });

  it("exports the simple and composable football modules", () => {
    const board = createFootballBoard({ id: "public-frame-board" });
    const store = createBoardEditorStore({
      initialBoard: board,
      tools: createFootballTools(),
    });

    expect(store.getState().ui.navigationMode).toBe("free");
    expect(
      createBoardEditorStore({
        initialBoard: board,
        navigationMode: "contained",
        tools: createFootballTools(),
      }).getState().ui.navigationMode,
    ).toBe("contained");

    expect(() =>
      renderToString(
        createElement(BoardViewerCanvas, {
          board,
          objectRenderers: getFootballObjectRenderers(),
        }),
      ),
    ).not.toThrow();

    const footballPitchFrameOptions = FOOTBALL_PITCH_OPTIONS.map((option) => ({
      ...option,
      createFrame: () => createFootballPitch(option.value),
    }));

    expect(() =>
      renderToString(
        createElement(
          BoardEditorProvider,
          { store },
          createElement(
            BoardEditor,
            null,
            createElement(BoardEditorCanvas),
            createElement(BoardEditorShapePolygonDone),
            createElement(BoardEditorCanvasToolbar),
            createElement(BoardEditorSelectionToolbar),
            createElement(
              BoardEditorToolbarDockProvider,
              { defaultSecondaryToolbarOpen: false },
              createElement(
                BoardEditorToolbarDock,
                { placement: "right" },
                createElement(
                  BoardPrimaryToolbar,
                  {
                    adapters: footballThemeAdapters,
                    showEquipment: true,
                    theme: footballTheme,
                  },
                  createElement(BoardEditorFrameVariantToolControl, {
                    toolId: FOOTBALL_PITCH_TOOL_ID,
                    options: footballPitchFrameOptions,
                    getValue: getFootballPitchVariant,
                  }),
                ),
                createElement(BoardEditorFrameVariantDefaultsToolbar, {
                  toolId: FOOTBALL_PITCH_TOOL_ID,
                  options: footballPitchFrameOptions,
                  getValue: getFootballPitchVariant,
                }),
                createElement(BoardEditorSecondaryToolbar, {
                  adapters: footballThemeAdapters,
                  theme: footballTheme,
                }),
                createElement(
                  BoardEditorToolbar,
                  null,
                  createElement(BoardEditorHandToolControl),
                  createElement(BoardEditorPlayerToolControl),
                  createElement(BoardEditorEquipmentToolControl),
                  createElement(BoardEditorTextToolControl),
                ),
              ),
            ),
          ),
        ),
      ),
    ).not.toThrow();
  });

  it("exports the simple and composable basketball modules", () => {
    const board = createBasketballBoard({ id: "public-basketball-board" });
    const store = createBoardEditorStore({
      initialBoard: board,
      tools: createBasketballTools(),
    });

    expect(store.getState().ui.navigationMode).toBe("free");
    expect(
      createBoardEditorStore({
        initialBoard: board,
        navigationMode: "contained",
        tools: createBasketballTools(),
      }).getState().ui.navigationMode,
    ).toBe("contained");

    expect(() =>
      renderToString(
        createElement(BoardViewerCanvas, {
          board,
          objectRenderers: getBasketballObjectRenderers(),
        }),
      ),
    ).not.toThrow();

    expect(() =>
      renderToString(
        createElement(
          BoardEditorProvider,
          { store },
          createElement(
            BoardEditor,
            null,
            createElement(BoardEditorCanvas),
            createElement(BoardEditorShapePolygonDone),
            createElement(BoardEditorCanvasToolbar),
            createElement(BoardEditorSelectionToolbar),
            createElement(
              BoardEditorToolbarDockProvider,
              null,
              createElement(
                BoardEditorToolbarDock,
                null,
                createElement(BoardPrimaryToolbar, {
                  theme: basketballTheme,
                }),
                createElement(BoardEditorSecondaryToolbar, {
                  theme: basketballTheme,
                }),
              ),
            ),
          ),
        ),
      ),
    ).not.toThrow();
  });

  it("exports football viewer object renderers", () => {
    const customPlayerRenderer = () => {};
    const renderers = getFootballObjectRenderers();
    const overriddenRenderers = getFootballObjectRenderers({
      [PLAYER_OBJECT_TYPE]: customPlayerRenderer,
    });

    expect(renderers[PLAYER_OBJECT_TYPE]).toBeTypeOf("function");
    expect(renderers[EQUIPMENT_OBJECT_TYPE]).toBeTypeOf("function");
    expect(renderers[TEXT_OBJECT_TYPE]).toBeTypeOf("function");
    expect(renderers[ARROW_OBJECT_TYPE]).toBeTypeOf("function");
    expect(renderers[SHAPE_OBJECT_TYPE]).toBeTypeOf("function");
    expect(overriddenRenderers[PLAYER_OBJECT_TYPE]).toBe(customPlayerRenderer);
    expect(overriddenRenderers[EQUIPMENT_OBJECT_TYPE]).toBe(
      renderers[EQUIPMENT_OBJECT_TYPE],
    );
  });

  it("exports basketball viewer object renderers", () => {
    const customPlayerRenderer = () => {};
    const renderers = getBasketballObjectRenderers();
    const overriddenRenderers = getBasketballObjectRenderers({
      [PLAYER_OBJECT_TYPE]: customPlayerRenderer,
    });

    expect(renderers[PLAYER_OBJECT_TYPE]).toBeTypeOf("function");
    expect(renderers[TEXT_OBJECT_TYPE]).toBeTypeOf("function");
    expect(renderers[ARROW_OBJECT_TYPE]).toBeTypeOf("function");
    expect(renderers[SHAPE_OBJECT_TYPE]).toBeTypeOf("function");
    expect(overriddenRenderers[PLAYER_OBJECT_TYPE]).toBe(customPlayerRenderer);
    expect(overriddenRenderers[TEXT_OBJECT_TYPE]).toBe(
      renderers[TEXT_OBJECT_TYPE],
    );
  });
});
