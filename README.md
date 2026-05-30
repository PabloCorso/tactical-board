# Tactical Board

Reusable tactical board/editor library for embedding coach-facing planning boards
in React applications.

Tactical Board lets a host app create, edit, render, and serialize bounded visual
planning canvases for sport workflows such as tactics, game plans, and practice
drills. It provides the editing engine, canvas rendering, React integration,
standard tools, and board UI primitives; sport adapters such as football and
basketball add pitch/court frames, object presets, skins, themes, and tool
registrations.

The package is centered on composable `BoardEditor` and `BoardViewer`
components. Sport packages provide defaults that a host app can compose into its
own board experience.

## Architecture

The repository is scaffolded around a simple layered architecture.

- `src/core`: the framework-independent Editor Engine. It owns Document/Shape state, editor operations, tool contracts, geometry contracts, selection, history, and serialization entrypoints.
- `src/rendering/canvas`: the Canvas Renderer. It paints Document or Board state and transient overlays to HTML canvas.
- `src/react/adapter`: the React Adapter. It wires DOM input and subscriptions without owning canonical Document state.
- `src/react/board`: shared Board Editor UI, Theme composition, toolbar, renderer, and Tool registration modules.
- `src/react/sports`: sport adapters such as football and basketball. They own sport-specific frames, dimensions, object presets, skins, themes, and tool registrations.
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
  BoardEditorArrowToolControl,
  BoardEditorProvider,
  BoardEditorHandToolControl,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorSelectToolControl,
  BoardEditorShapeToolControl,
  BoardEditorTextToolControl,
  BoardEditorToolbar,
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
            <BoardEditorSelectToolControl />
            <BoardEditorHandToolControl />
            <BoardEditorTextToolControl />
            <BoardEditorArrowToolControl />
            <BoardEditorShapeToolControl />
          </BoardEditorToolbar>
        </div>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
```

Sport adapters are defaults, not separate React editors. For football, compose
the generic editor store with `createFootballTools()`, then render the generic
editor components with `footballTheme`, `footballThemeAdapters`, and any
sport-specific frame controls your app wants to expose:

```tsx
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorSecondaryToolbar,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorToolbarDock,
  BoardEditorToolbarDockProvider,
  BoardPrimaryToolbar,
  createBoardEditorStore,
  createFootballBoard,
  createFootballTools,
  footballTheme,
  footballThemeAdapters,
  getFootballPitchFitPadding,
} from "@pablocorso/tactical-board/react";

const store = createBoardEditorStore({
  initialBoard: createFootballBoard({ id: "match-plan", name: "Match Plan" }),
  fitPadding: getFootballPitchFitPadding,
  tools: createFootballTools(),
});

export function MatchPlanEditor() {
  return (
    <BoardEditorProvider store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <BoardEditorToolbarDockProvider>
          <BoardEditorToolbarDock>
            <BoardPrimaryToolbar
              adapters={footballThemeAdapters}
              showEquipment
              theme={footballTheme}
            />
            <BoardEditorSecondaryToolbar
              adapters={footballThemeAdapters}
              theme={footballTheme}
            />
          </BoardEditorToolbarDock>
        </BoardEditorToolbarDockProvider>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
```

Run `npm run storybook` and open `React/Board Editor/Football` for an interactive reference.

### Custom toolbars, export, and share

Host apps can compose their own toolbar around the exported toolbar primitives.
Use the library for editor state, rendering, serialization, and visual controls;
keep product-specific actions such as save, upload, deep links, WhatsApp links,
native share sheets, and analytics in the host app.

```tsx
import {
  BoardEditorToolbar,
  BoardEditorToolbarButton,
  serializeBoard,
  useBoardEditorStore,
} from "@pablocorso/tactical-board/react";
import { FloppyDiskIcon, ShareNetworkIcon } from "@phosphor-icons/react";

function HostActionsToolbar() {
  const board = useBoardEditorStore((state) => state.board);

  return (
    <BoardEditorToolbar>
      <BoardEditorToolbarButton
        aria-label="Save board"
        iconBefore={FloppyDiskIcon}
        tooltip="Save board"
        onClick={() => {
          const json = serializeBoard(board);

          void saveBoardInHostApp(json);
        }}
      />
      <BoardEditorToolbarButton
        aria-label="Share board"
        iconBefore={ShareNetworkIcon}
        tooltip="Share board"
        onClick={() => {
          void openHostShareWorkflow(board);
        }}
      />
    </BoardEditorToolbar>
  );
}
```

Import `@pablocorso/tactical-board/styles.css` once in the host app. Toolbar
components read Tactical Board CSS variables from `[data-tactical-board]`, and
host apps may override those variables to match their own design system.

## SSR compatibility

The package is safe to statically import and server-render in React SSR apps,
including React Router SSR apps. Consumers should not need to wrap tactical-board
imports in `useEffect` or dynamic `import()` just to avoid browser globals.

During SSR the React adapter renders structural HTML, including empty
`<canvas>` elements. Browser-only work such as `canvas.getContext("2d")`,
`ResizeObserver`, pointer input, focus management, and animation frame scheduling
runs after hydration.
