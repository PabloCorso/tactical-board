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

- `src/core`: the framework-independent Editor Engine. It owns Document/Object state, editor operations, tool contracts, geometry contracts, selection, history, and serialization entrypoints.
- `src/rendering/canvas`: the Canvas Renderer. It paints Document or Board state and transient overlays to HTML canvas.
- `src/react/adapter`: the React Adapter. It wires DOM input and subscriptions without owning canonical Document state.
- `src/react/board`: shared Board Editor UI, Theme composition, toolbar, renderer, and Tool registration modules.
- `src/react/sports`: sport adapters such as football and basketball. They own sport-specific frames, dimensions, object presets, skins, themes, and tool registrations.
- `src/tools`: reusable Standard Tools such as Select, Hand, Shape, Arrow, Text, Player, and Equipment.

The shared Board Library seam is now expressed inside `src/react/board` for React-facing Board modules. Framework-independent Board concepts still live in `src/core` until a concrete non-React seam is proven.

See [architecture.md](./architecture.md), [CONTEXT.md](./CONTEXT.md), and [docs/adr](./docs/adr) for the agreed glossary, boundaries, and architectural decisions.

## React integration

React consumers build a board editor by creating a board document, composing its Tools and Object Definitions, and rendering the React adapter around a shared editor store.

```tsx
import {
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
  createBoardEditorConfig,
  createBoardEditorStore,
} from "@pablocorso/tactical-board/react";

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

const config = createBoardEditorConfig();
const store = createBoardEditorStore({
  initialBoard: board,
  initialToolId: "select",
  ...config,
});

export function TrainingBoardEditor() {
  return (
    <BoardEditorProvider config={config} store={store}>
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

Sport adapters are defaults, not separate React editors. For football, create one
configuration with `createFootballEditorConfig()`, use it to create the generic
editor store, and share it through the provider. React composition and
sport-specific frame controls remain under the Host App's control:

```tsx
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorCanvasToolbar,
  BoardEditorProvider,
  BoardEditorSecondaryToolbars,
  BoardEditorSelectionToolbar,
  BoardEditorShapePolygonDone,
  BoardEditorToolbarDock,
  BoardEditorToolbarDockProvider,
  BoardPrimaryToolbar,
  createBoardEditorStore,
  createFootballBoard,
  createFootballEditorConfig,
} from "@pablocorso/tactical-board/react";

const config = createFootballEditorConfig();
const store = createBoardEditorStore({
  initialBoard: createFootballBoard({ id: "match-plan", name: "Match Plan" }),
  ...config,
});

export function MatchPlanEditor() {
  return (
    <BoardEditorProvider config={config} store={store}>
      <BoardEditor className="relative h-dvh w-full overflow-hidden">
        <BoardEditorCanvas />
        <BoardEditorShapePolygonDone />
        <BoardEditorCanvasToolbar />
        <BoardEditorSelectionToolbar />
        <BoardEditorToolbarDockProvider>
          <BoardEditorToolbarDock>
            <BoardPrimaryToolbar />
            <BoardEditorSecondaryToolbars />
          </BoardEditorToolbarDock>
        </BoardEditorToolbarDockProvider>
      </BoardEditor>
    </BoardEditorProvider>
  );
}
```

Football Theme Data includes player appearance choices, while football adapters
provide runtime rendering behavior. The provider shares the resolved config with
the composed editor primitives; an explicit primitive prop still overrides the
inherited value when a Host App needs local customization.

### Add or replace Objects and Tools

Object Definitions and Tools use the same configuration seam as the built-in
editor. A Host App can extend a sport config directly without rebuilding its
Theme composition:

```tsx
import { createFootballEditorConfig } from "@pablocorso/tactical-board/react";
import { hostZoneObjectDefinition } from "./host-zone-object";
import { hostZoneTool } from "./host-zone-tool";

const config = createFootballEditorConfig({
  objectDefinitions: [hostZoneObjectDefinition],
  tools: [hostZoneTool],
});
```

A custom Object Definition with the same Object type replaces the built-in
definition. A custom Tool with the same Tool ID replaces the built-in Tool. The
resulting config works unchanged with both `createBoardEditorStore` and
`BoardViewerCanvas`.

Run `npm run storybook` and open `React/Board Editor/Football` for an interactive reference.
The source examples in `src/stories/examples` are written as copyable host-app
integration references for humans and AI agents. They intentionally use the
public React entrypoint and keep Storybook metadata in separate `*.stories.tsx`
files.

### Custom toolbars, export, and share

Host apps can compose their own toolbar around the exported toolbar primitives.
Use the library for editor state, rendering, serialization, and visual controls;
keep product-specific actions such as save, upload, deep links, WhatsApp links,
native share sheets, and analytics in the host app.

The built-in secondary toolbars are also exported individually. Each one knows
its Tool ID and renders only while that Tool is active, so specialized inputs
stay local to the toolbar that consumes them:

```tsx
<>
  <BoardEditorPlayerGroupToolbar>
    <BoardEditorTeamPanelContent>
      <TeamPanelPlayerLabelSection />
      <HostPlayerGroupAppearanceSection />
      <TeamPanelRosterSection />
      <HostPlayerGroupWorkflowSection />
      <TeamPanelDeleteSection />
    </BoardEditorTeamPanelContent>
  </BoardEditorPlayerGroupToolbar>
  <BoardEditorEquipmentToolbar />
  <BoardEditorArrowToolbar defaults={hostArrowDefaults} />
  <BoardEditorShapeToolbar density="compact" />
</>
```

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
