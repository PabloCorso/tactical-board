# Tactical Board

Reusable tactical board/editor library scaffolded around a simple layered architecture.

- `src/core`: the framework-independent Editor Engine. It owns Document/Shape state, editor operations, tool contracts, geometry contracts, selection, history, and serialization entrypoints.
- `src/rendering/canvas`: the Canvas Renderer. It paints Document or Board state and transient overlays to HTML canvas.
- `src/react`: the React Adapter and Board Editor UI shell. It wires DOM input and subscriptions without owning canonical Document state.
- `src/tools`: reusable Standard Tools such as Select, Hand, Shape, Arrow, Text, Player, and Equipment.
- `src/examples/football`: the first Football Board pressure-test application. It owns football-specific surfaces, dimensions, object presets, skins, and coach-facing workflows while it remains under examples.

The shared Board Library boundary is still emerging. Do not extract a broad `src/board` or `src/presets` layer until a concrete boundary is proven by more than the football example.

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
  surface: {
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

The football implementation is the current full React composition example. It is published as an example subpath, so consumers can inspect or render it without relying on `src` files being present in `node_modules`:

```tsx
import { FootballExampleApp } from "@pablocorso/tactical-board/examples/football";
```

The example exports the football board document, football-specific tool presets, equipment definitions, toolbar composition, icons, and the full `FootballExampleApp`. It is still an example boundary rather than a stable football preset API.

Run `npm run storybook` and open `React/Board Editor/Football Example` for an interactive reference.
