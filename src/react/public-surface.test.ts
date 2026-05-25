import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorToolbarDock,
  createFootballBoard,
  createFootballBoardEditorStore,
  FootballBoardViewerCanvas,
  FootballBoardEditor,
  FootballPrimaryToolbar,
  FootballSecondaryToolbar,
  getFootballObjectRenderers,
} from ".";
import { ARROW_OBJECT_TYPE } from "../core/objects/arrow-object";
import { EQUIPMENT_OBJECT_TYPE } from "../core/objects/equipment-object";
import { PLAYER_OBJECT_TYPE } from "../core/objects/player-object";
import { SHAPE_OBJECT_TYPE } from "../core/objects/shape-object";
import { TEXT_OBJECT_TYPE } from "../core/objects/text-object";

describe("React public frame", () => {
  it("exports the simple and composable football modules", () => {
    const board = createFootballBoard({ id: "public-frame-board" });
    const store = createFootballBoardEditorStore(board);

    expect(() =>
      renderToString(createElement(FootballBoardEditor)),
    ).not.toThrow();

    expect(() =>
      renderToString(createElement(FootballBoardViewerCanvas, { board })),
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
              BoardEditorToolbarDock,
              null,
              createElement(FootballPrimaryToolbar),
              createElement(FootballSecondaryToolbar),
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
});
