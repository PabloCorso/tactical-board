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
components. Sport packages provide defaults that a host app composes into its
own board experience.

## Architecture

The framework-independent Editor Engine owns Document state and editing rules;
the Canvas Renderer paints it; React and sport modules provide adapters and
coach-facing workflows. See [architecture.md](./architecture.md) for the source
map, [CONTEXT.md](./CONTEXT.md) for shared terminology, and
[docs/adr](./docs/adr) for durable decisions.

## React integration

React consumers create a document, resolve an editor configuration, create one
shared store, and render the adapter around it. Sport adapters are defaults, not
separate React editors. A minimal football composition is:

```tsx
import {
  BoardEditor,
  BoardEditorCanvas,
  BoardEditorProvider,
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
      </BoardEditor>
    </BoardEditorProvider>
  );
}
```

The maintained [football example](./src/stories/examples/football-board-editor.example.tsx)
shows the complete composition: toolbars, team panels, pitch controls, labels,
and customization seams. It is executable and is the canonical host-app example.
Import `@pablocorso/tactical-board/styles.css` once in the host app.

Host apps own persistence, migration, save/export/share workflows, analytics,
and routing. The library provides editor state, rendering, serialization, and
composable UI primitives.

## SSR compatibility

The package is safe to statically import and server-render in React SSR apps.
Consumers should not need `useEffect` or dynamic `import()` merely to avoid
browser globals.

During SSR the React adapter renders structural HTML, including empty
`<canvas>` elements. Browser-only work such as `canvas.getContext("2d")`,
`ResizeObserver`, pointer input, focus management, and animation frame scheduling
runs after hydration.
