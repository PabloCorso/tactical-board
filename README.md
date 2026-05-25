# Tactical Board

Reusable tactical board/editor library scaffolded around a simple layered architecture.

- `src/core`: the framework-independent Editor Engine. It owns Document/Shape state, editor operations, tool contracts, geometry contracts, selection, history, and serialization entrypoints.
- `src/rendering/canvas`: the Canvas Renderer. It paints Document or Board state and transient overlays to HTML canvas.
- `src/react/adapter`: the React Adapter. It wires DOM input and subscriptions without owning canonical Document state.
- `src/react/board`: shared Board Editor UI, Theme composition, toolbar, renderer, and Tool registration modules.
- `src/react/sports`: sport adapters such as football and basketball. They own sport-specific frames, dimensions, object presets, skins, and composed React editors.
- `src/tools`: reusable Standard Tools such as Select, Hand, Shape, Arrow, Text, Player, and Equipment.

The shared Board Library seam is now expressed inside `src/react/board` for React-facing Board modules. Framework-independent Board concepts still live in `src/core` until a concrete non-React seam is proven.

See [architecture.md](./architecture.md), [CONTEXT.md](./CONTEXT.md), and [docs/adr](./docs/adr) for the agreed glossary, boundaries, and architectural decisions.

## React integration

React consumers build a board editor by creating a board document, registering the tools they want to expose, and rendering the React adapter around a shared editor store.

```tsx
import {
  ArrowTool,
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorToolbar,
  BoardEditorToolControl,
  createBoard,
  createBoardEditorStore,
  HandTool,
  SelectTool,
  ShapeTool,
  TextTool,
} from "@pablocorso/tactical-board";

const board = createBoard({
  id: "training-board",
  version: 1,
  metadata: { name: "Training board" },
  frame: {
    width: 1200,
    height: 800,
    fill: "#f8fafc",
  },
  objects: {
    byId: {},
    order: [],
  },
  style: {},
});

const store = createBoardEditorStore({
  initialBoard: board,
  initialToolId: "select",
  tools: [
    new SelectTool(),
    new HandTool(),
    new TextTool(),
    new ArrowTool(),
    new ShapeTool(),
  ],
});

export function TrainingBoardEditor() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <BoardEditorToolbar className="pointer-events-auto flex-col">
            <BoardEditorToolControl toolId="select" />
            <BoardEditorToolControl toolId="hand" />
            <BoardEditorToolControl toolId="text" />
            <BoardEditorToolControl toolId="arrow" />
            <BoardEditorToolControl toolId="shape" />
          </BoardEditorToolbar>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
```

The football implementation is published as a React preset package. Consumers can render the composed editor or import the underlying board, tool, equipment, icon, and toolbar parts:

```tsx
import {
  createFootballBoard,
  FootballBoardEditor,
} from "@pablocorso/tactical-board/react";
```

`FootballBoardEditor` accepts a caller-owned store or initial board. Without either, it creates an empty full-pitch football document via `createFootballBoard()`. Local showcase data lives under `src/examples` for Storybook and visual smoke testing rather than the public football API.

Football UI is also composable. Use `createFootballBoardEditorStore()` for the football tool setup, then arrange the generic React adapter pieces and football toolbar pieces in your own shell:

```tsx
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  createFootballBoard,
  createFootballBoardEditorStore,
  FootballPrimaryToolbar,
  FootballSecondaryToolbar,
} from "@pablocorso/tactical-board/react";

const store = createFootballBoardEditorStore(
  createFootballBoard({ id: "match-plan", name: "Match Plan" }),
);

export function CustomFootballBoardEditor() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <div className="pointer-events-none absolute inset-y-4 left-4 flex items-center">
          <div className="pointer-events-auto flex items-center gap-3">
            <FootballPrimaryToolbar />
            <FootballSecondaryToolbar className="flex-col" />
          </div>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
```

Run `npm run storybook` and open `React/Board Editor/Football` for an interactive reference.

## SSR compatibility

The package is safe to statically import and server-render in React SSR apps,
including React Router SSR apps. Consumers should not need to wrap tactical-board
imports in `useEffect` or dynamic `import()` just to avoid browser globals.

During SSR the React adapter renders structural HTML, including empty
`<canvas>` elements. Browser-only work such as `canvas.getContext("2d")`,
`ResizeObserver`, pointer input, focus management, and animation frame scheduling
runs after hydration.
