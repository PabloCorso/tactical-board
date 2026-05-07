# Tactical Board Architecture

## Goals

- Keep the architecture simple and understandable.
- Optimize for a high-quality coach workflow without baking football assumptions into the core.
- Support both interactive editing and read-only rendering from the same Board data.
- Preserve room for future custom object types, surfaces, skins, and tools without designing a large framework upfront.

## Core Concepts

- **Board** is the main persistent unit.
- **Board Editor** edits one Board at a time.
- **Board Renderer** displays a Board in read-only contexts such as previews, thumbnails, and export flows.
- **Engine** is framework-independent and owns Board state, editing operations, object dispatch, geometry contracts, and serialization boundaries.
- **Board Editor Store** is the framework-independent store boundary for Board editing state and actions.
- **Canvas Renderer** paints Board state and transient overlays.
- **React** hosts the editor surface and surrounding UI, but does not own the Board state.

## Boundaries

### `src/core`

Owns:

- Board types and schema-facing types
- framework-independent board editor store
- editor operations
- object definitions
- tool contracts
- geometry and hit-testing contracts
- serialization entrypoints

Does not own:

- canvas drawing details
- React state or components
- persistence implementation
- host-app migration policy

### `src/rendering/canvas`

Owns:

- canvas draw loop
- viewport-to-pixel mapping
- surface drawing
- object render hooks
- transient overlays

Does not own:

- business rules for editing
- persistence
- React shell

### `src/react`

Owns:

- `BoardEditor`
- `BoardView`
- React hooks and subscriptions
- input wiring between DOM events and tools/editor operations

Does not own:

- canonical Board state
- serialization rules
- object semantics

### `src/presets`

Owns:

- built-in surfaces
- built-in object kinds
- built-in tools
- built-in skins

This is where football enters first. The core should remain sport-agnostic.

## Data Model

### Persistent Board Data

Persist only Board data:

- board id and metadata
- surface preset/config
- objects
- explicit ordering
- board-level style/theme references

Do not persist editor UI state such as:

- selection
- active tool
- hover
- temporary drags
- zoom/pan session state

### Internal Object Storage

Inside the Engine, objects should be stored canonically as:

- `byId: Record<ObjectId, BoardObject>`
- `order: ObjectId[]`

This keeps lookup/update operations simple while preserving explicit ordering.

### Layering and Interaction

Rendering order alone should not define interaction. Objects need separate concepts for:

- visual order
- hit-test behavior
- selectability

This allows overlays or zones to render above players while remaining passthrough or less intrusive to selection.

## Extensibility

### Objects

Objects are type-based. Each type has an **Object Definition** with:

- default props
- geometry/bounds behavior
- hit-testing behavior
- render hook

Player tokens are Board Objects. Skins such as dots, numbered circles, shirts, or stylized players are visual concerns, not separate persistent object semantics.

### Tools

Tools are registered and built-in at first. A Tool:

- interprets input
- owns temporary interaction state
- invokes editor operations
- may contribute transient overlays

It does not directly mutate Board state.

### Surfaces

Surfaces are presets. Football is the first preset, not the architecture.

## Serialization

- Persist explicit JSON Board schema, not raw internal store state.
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
  presets/
  examples/
```

This keeps the repo simple while allowing clean future extraction into separate packages if the seams prove stable.
