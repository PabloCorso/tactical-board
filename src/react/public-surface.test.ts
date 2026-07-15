import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardEditor,
  BoardEditorArrowToolbar,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorLabelsProvider,
  BoardEditorEquipmentToolbar,
  BoardEditorEquipmentToolControl,
  BoardEditorFrameVariantDefaultsToolbar,
  BoardEditorFrameVariantToolControl,
  BoardEditorHandToolControl,
  BoardEditorPlayerToolControl,
  BoardEditorPlayerGroupToolbar,
  BoardEditorProvider,
  BoardEditorSecondaryToolbars,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorShapeToolbar,
  BoardEditorSelectToolControl,
  BoardEditorTeamPanelContent,
  BoardEditorTeamPanelDock,
  BoardEditorTeamPanelProvider,
  BoardEditorTextToolControl,
  BoardEditorToolbarDockProvider,
  BoardEditorToolbar,
  BoardEditorToolbarDock,
  BoardEditorToolbarGroup,
  BoardEditorToolbarPopover,
  BoardEditorToolbarPopoverContent,
  BoardEditorToolbarPopoverTrigger,
  BoardViewerCanvas,
  BoardPrimaryToolbar,
  TeamPanelCaptionSection,
  TeamPanelDeleteSection,
  TeamPanelPlayerLabelSection,
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
import { ARROW_OBJECT_TYPE } from "../core/objects/arrow-object";
import { ARROW_TOOL_ID } from "../core/tools/arrow-tool-state";
import { EQUIPMENT_OBJECT_TYPE } from "../core/objects/equipment-object";
import { PLAYER_OBJECT_TYPE } from "../core/objects/player-object";
import { SHAPE_OBJECT_TYPE } from "../core/objects/shape-object";
import { TEXT_OBJECT_TYPE } from "../core/objects/text-object";

describe("React public frame", () => {
  it("keeps football player groups on generic circle defaults", () => {
    const board = createFootballBoard({ id: "football-player-groups" });

    expect(board.playerGroups?.[0]?.style.appearanceId).toBeUndefined();
    expect(board.playerGroups?.[0]?.style.colors).toBeUndefined();
  });

  it("exposes football player appearances through the theme", () => {
    expect(
      footballTheme.playerAppearances?.map((appearance) => appearance.id),
    ).toEqual(["circle", "football-shirt", "image"]);
    expect(footballThemeAdapters.playerAppearanceRenderers?.circle).toBeTypeOf(
      "function",
    );
    expect(
      footballThemeAdapters.playerAppearanceRenderers?.["football-shirt"],
    ).toBeTypeOf("function");
    expect(footballTheme.playerPresets?.length).toBeGreaterThan(0);
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

  it("composes toolbar families while tool controls retain button props", () => {
    const store = createBoardEditorStore({
      initialBoard: createFootballBoard({ id: "composable-toolbar" }),
      tools: createFootballTools(),
    });

    const markup = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(
          BoardEditorToolbar,
          null,
          createElement(
            BoardEditorToolbarGroup,
            { "aria-label": "Tools" },
            createElement(BoardEditorSelectToolControl, {
              disabled: true,
              title: "Select tool",
            }),
            createElement(
              BoardEditorToolbarPopover,
              null,
              createElement(BoardEditorToolbarPopoverTrigger, {
                "aria-label": "Style",
                children: createElement("span", null, "S"),
              }),
              createElement(
                BoardEditorToolbarPopoverContent,
                null,
                createElement("div", null, "Style options"),
              ),
            ),
          ),
        ),
      ),
    );

    expect(markup).toContain('role="group"');
    expect(markup).toContain('title="Select tool"');
    expect(markup).toContain("disabled");
    expect(markup).toContain('aria-label="Style"');
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
        createElement(BoardEditorPlayerGroupToolbar),
        createElement(BoardEditorEquipmentToolbar),
        createElement(BoardEditorArrowToolbar, {
          defaults: [
            {
              ...BOARD_ARROW_DEFAULTS[1],
              label: "Custom run",
            },
          ],
        }),
        createElement(BoardEditorShapeToolbar),
      ),
    );

    expect(markup).toContain('aria-label="Registered select"');
    expect(markup).toContain('aria-label="Custom select"');
    expect(markup).toContain('aria-label="Custom run"');
    expect(markup).not.toContain('aria-label="Add player group"');
  });

  it("uses the arrow presets registered by each sport tool set", () => {
    const renderArrowToolbar = (
      store: ReturnType<typeof createBoardEditorStore>,
    ) =>
      renderToString(
        createElement(
          BoardEditorProvider,
          { store },
          createElement(BoardEditorArrowToolbar),
        ),
      );

    const footballMarkup = renderArrowToolbar(
      createBoardEditorStore({
        initialBoard: createFootballBoard({ id: "football-arrows" }),
        initialToolId: ARROW_TOOL_ID,
        tools: createFootballTools(),
      }),
    );
    const basketballMarkup = renderArrowToolbar(
      createBoardEditorStore({
        initialBoard: createBasketballBoard({ id: "basketball-arrows" }),
        initialToolId: ARROW_TOOL_ID,
        tools: createBasketballTools(),
      }),
    );

    expect(footballMarkup).toContain('aria-label="Pass"');
    expect(footballMarkup).toContain('aria-label="Run"');
    expect(footballMarkup).toContain('aria-label="Dribble"');
    expect(footballMarkup).toContain('aria-label="Shot"');
    expect(footballMarkup).toContain('aria-label="Cross"');
    expect(footballMarkup).toContain('aria-label="Curved run"');
    expect(footballMarkup).toContain('aria-label="Line"');
    expect(footballMarkup).not.toContain('aria-label="Straight arrow"');
    expect(basketballMarkup).toContain('aria-label="Straight arrow"');
    expect(basketballMarkup).not.toContain('aria-label="Pass"');
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
                createElement(BoardEditorSecondaryToolbars, {
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

  it("lets consumers compose the player group panel section order", () => {
    const store = createBoardEditorStore({
      initialBoard: createFootballBoard({ id: "composable-team-panel" }),
      tools: createFootballTools(),
    });

    const markup = renderToString(
      createElement(
        BoardEditorProvider,
        { store },
        createElement(
          BoardEditorTeamPanelProvider,
          { defaultOpen: true },
          createElement(
            BoardEditorTeamPanelDock,
            null,
            createElement(
              BoardEditorTeamPanelContent,
              null,
              createElement(TeamPanelPlayerLabelSection),
              createElement(TeamPanelCaptionSection),
              createElement(TeamPanelDeleteSection),
            ),
          ),
        ),
      ),
    );

    expect(markup.indexOf(">Label<")).toBeLessThan(markup.indexOf(">Caption<"));
  });

  it("renders the active player toolbar without a team panel provider", () => {
    const store = createBoardEditorStore({
      initialBoard: createBasketballBoard({ id: "player-toolbar-no-panel" }),
      initialToolId: "player",
      tools: createBasketballTools(),
    });

    expect(() =>
      renderToString(
        createElement(
          BoardEditorProvider,
          { store },
          createElement(BoardEditorSecondaryToolbars, {
            theme: basketballTheme,
          }),
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
                createElement(BoardEditorSecondaryToolbars, {
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
