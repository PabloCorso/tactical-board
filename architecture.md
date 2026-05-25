# Tactical Board Architecture

## Goals

- Keep the architecture simple and understandable.
- Build a generic visual Editor Engine that can support board editors without becoming football-specific.
- Support high-quality coach workflows in board and sport-specific layers.
- Support both interactive editing and read-only rendering from the same Document data.
- Preserve room for future custom shape types, backgrounds, skins, and tools without designing a large framework upfront.
- Optimize for HTML canvas rendering instead of abstracting equally over Canvas, SVG, and WebGL.

## Core Concepts

- **Document** is the generic persistent editable content.
- **Shape** is a placed entity inside a Document.
- **Board** is a bounded visual planning canvas built as a specialization of a Document.
- **Board Editor** is a board-specific editor layer built on top of the generic Editor Engine.
- **Board Renderer** displays a Board in read-only contexts such as previews, thumbnails, and export flows.
- **Editor Engine** is framework-independent and owns Document state, editing operations, shape dispatch, geometry contracts, selection, history, and serialization boundaries.
- **Editor Store** is the framework-independent store boundary for editing state and actions.
- **Canvas Renderer** paints Document or Board state and transient overlays to HTML canvas.
- **React Adapter** hosts subscriptions, DOM input wiring, and editor UI, but does not own canonical Document state.

## Boundaries

### `src/core`

Owns:

- Document and schema-facing types
- framework-independent editor store
- editor operations
- shape definitions
- tool contracts
- geometry and hit-testing contracts
- selection and history state
- serialization entrypoints

Does not own:

- canvas drawing details
- React state or components
- persistence implementation
- host-app migration policy
- concrete tools such as Select, Hand, Shape, Arrow, or Text
- board, football, or coach-workflow semantics

### `src/rendering/canvas`

Owns:

- canvas draw loop
- viewport-to-pixel mapping
- document background and frame drawing
- shape render hooks
- transient overlays

Does not own:

- business rules for editing
- persistence
- React shell
- alternate renderer abstraction for SVG or WebGL

### `src/react`

Owns:

- React editor components such as `BoardEditor` and `BoardView`
- React hooks and subscriptions
- input wiring between DOM events and tools/editor operations

Does not own:

- canonical Document state
- serialization rules
- shape semantics

### `src/tools`

Owns:

- reusable standard tools such as Select, Hand, Shape, Arrow, and Text
- tool-specific temporary interaction state
- tool-provided renderers, hit-testers, overlays, and shape definitions

Does not own:

- core Editor Engine behavior
- privileged tool behavior inside `src/core`
- football or sport-specific UX

### Board and Sport Layers

Own:

- board-specific Frames
- board-specific Shapes such as Player Tokens and equipment
- board or sport-specific presets, dimensions, and coach-facing UI
- Football as the first consumer-ready React board package

The football editor lives under `src/react/football`. It is not disposable demo code: it is the first React consumer package for football-specific board creation, tools, equipment, icons, and editor composition. Shared board abstractions should be extracted only when multiple sports or concrete planning use cases prove the boundary.

The current `src/core/board` directory is a compatibility namespace for Board-facing types and helpers during the incremental migration from Board/Object vocabulary to Document/Shape vocabulary. It is not a fully extracted shared Board Library layer. New shared Board Library code should appear only when a concrete boundary exists outside the football package.

## Data Model

### Persistent Document Data

Persist only Document data:

- document id and metadata
- document background or board frame config
- shapes
- explicit ordering
- document-level style/theme references

Do not persist editor UI state such as:

- selection
- active tool
- hover
- temporary drags
- zoom/pan session state

### Internal Shape Storage

Inside the Editor Engine, shapes should be stored canonically as:

- `byId: Record<ShapeId, Shape>`
- `order: ShapeId[]`

This keeps lookup/update operations simple while preserving explicit ordering.

### Layering and Interaction

Rendering order alone should not define interaction. Shapes need separate concepts for:

- visual order
- hit-test behavior
- selectability

This allows overlays or zones to render above players while remaining passthrough or less intrusive to selection.

## Extensibility

### Shapes

Shapes are type-based. Each type has a **Shape Definition** with:

- default props
- geometry/bounds behavior
- hit-testing behavior
- render hook

Player tokens are board-specific Shapes. Skins such as dots, numbered circles, shirts, or stylized players are visual concerns, not separate persistent shape semantics.

### Tools

The Editor Engine defines tool contracts but does not privilege concrete tools. A Tool:

- interprets input
- owns temporary interaction state
- invokes editor operations
- may contribute transient overlays

It does not directly mutate Document state.

Reusable tools such as Select, Hand, Shape, Arrow, and Text live in a standard tools layer and are registered by editor instances. The default tool is configured by id; the Engine must not know that Select is special.

### Selection

Selection is generic editor-session state, not Select tool state. Tools may change selection or decide whether to show selection chrome, but keyboard shortcuts, history, and editor operations should not depend on importing a specific Select tool.

### Backgrounds and Frames

The generic core has a Document Background for base visuals and coordinate setup. Board layers define Frames with sport-oriented markings such as fields and courts. Football is the first pressure-test frame, not the architecture.

### Units

Documents may declare a measurement unit such as pixels or meters. The Editor Engine uses units for coordinate conversion and scale, while board and sport layers assign domain meaning such as pitch dimensions, equipment size, or player spacing.

### Timeline

The generic core may later own a lower-level Timeline and Frame model. Board Sequence is the board-specific presentation of that model for coach-facing animation or step playback.

## Serialization

- Persist explicit JSON Document Schema, or a board-specific Board Schema profile, not raw internal store state.
- Host apps own persistence and migration policy.
- The library can expose parse/serialize helpers and runtime validation at the boundary.
- Runtime validation is still useful even with TypeScript because persisted JSON is untrusted input.

## Delivery Shape

Start as one package with strict internal boundaries:

```text
src/
  core/
  rendering/
  react/
  tools/
  board/       # later, only when shared board abstractions emerge
  presets/     # later, only when cross-board presets emerge
  examples/
    football/  # current first pressure-test application
```

This keeps the repo simple while allowing clean future extraction into separate packages if the boundaries prove stable. The current code may still use Board names while the migration proceeds incrementally; new architectural work should follow the Document/Shape/Editor vocabulary.
