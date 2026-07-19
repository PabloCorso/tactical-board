# Tactical Board Architecture

## Goals

- Keep the architecture simple and understandable.
- Build a generic visual Editor Engine that can support board editors without becoming football-specific.
- Support high-quality coach workflows in board and sport-specific layers.
- Support both interactive editing and read-only rendering from the same Document data.
- Preserve room for future custom Object types, backgrounds, skins, and tools without designing a large framework upfront.
- Optimize for HTML canvas rendering instead of abstracting equally over Canvas, SVG, and WebGL.

## Domain Language

[CONTEXT.md](./CONTEXT.md) is the canonical glossary for this architecture. This document uses that language to describe responsibilities and boundaries without redefining it.

## Boundaries

### `src/core`

Owns:

- Document and schema-facing types
- framework-independent editor store
- editor operations
- Object Definitions
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
- Object render hooks
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
- Tool-provided transient overlays

Does not own:

- core Editor Engine behavior
- privileged tool behavior inside `src/core`
- football or sport-specific UX

### Board and Sport Layers

Own:

- board-specific Frames
- board-specific Objects such as Players and equipment
- board or sport-specific presets, dimensions, and coach-facing UI
- Football as the first consumer-ready React board package

React-facing Board modules live under `src/react/board`. The sport adapters live under `src/react/sports`: football and basketball own sport-specific board creation, tools, equipment, icons, and editor composition. The football adapter is not disposable demo code; it remains the first consumer package that pressure-tests the shared Board Editor modules.

The current `src/core/board` directory is a compatibility namespace for Board-facing types and helpers during the incremental migration from Board/BoardObject vocabulary to Document/Object vocabulary. It is not a fully extracted shared Board Library layer. New shared Board Library code should appear only when a concrete boundary exists outside the football package.

## Data Model

### Persistent Document Data

Persist only Document data:

- document id and metadata
- document background or board frame config
- Objects
- explicit ordering
- document-level style/theme references

Do not persist editor UI state such as:

- selection
- active tool
- hover
- temporary drags
- zoom/pan session state

### Internal Object Storage

Inside the Editor Engine, Objects should be stored canonically as:

- `byId: Record<ObjectId, Object>`
- `order: ObjectId[]`

This keeps lookup/update operations simple while preserving explicit ordering.

### Layering and Interaction

Rendering order alone does not define interaction. Each Object Definition supplies the Object type's Canvas hit testing independently from its default ordering rank. Transient overlays remain Tool rendering and are not persistent Objects.

### Editing Defaults

Persistent Objects contain editable values such as position, size, rotation, and color, not editor capability flags or per-Object locking state. Movement and rotation are supported by default. Object-specific geometry and Selection interactions are implemented directly instead of being enabled or disabled through capability booleans.

## Extensibility

### Objects

Objects are type-based. Each type has an **Object Definition** with:

- default ordering rank
- custom transform implementation when its geometry needs one
- Selection behavior
- optional editing hooks
- one Canvas adapter containing rendering and hit-testing behavior

Object Definitions are runtime configuration scoped to an editor or renderer instance. Internal consumers dispatch rendering, hit testing, Selection, and transforms through that one registration. Theme catalogs remain serializable data and are resolved into Object Definitions without module-global registries.

Players are board-specific Objects. Skins such as dots, numbered circles, shirts, or stylized players are visual concerns, not separate persistent Object semantics.

### Tools

The Editor Engine defines tool contracts but does not privilege concrete tools. A Tool:

- interprets input
- owns temporary interaction state
- invokes editor operations
- may contribute transient overlays

It does not directly mutate Document state.

A Tool also does not register the Object types it creates. Editor configuration composes Tools and Object Definitions together, which lets an existing Document render and remain editable even when its creation Tool is not installed.

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
- Persist Object facts, not Object Definitions, renderer functions, editing capability flags, or runtime catalog snapshots.
- Host apps own persistence and migration policy.
- The library can expose parse/serialize helpers and runtime validation at the boundary.
- Runtime validation is still useful even with TypeScript because persisted JSON is untrusted input.

## Delivery Structure

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

This keeps the repo simple while allowing clean future extraction into separate packages if the boundaries prove stable. The current code still contains legacy `Shape*` names for generic Objects while the migration proceeds incrementally; new architectural work should follow the Document/Object/Editor vocabulary.
