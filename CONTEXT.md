# Board Editor Context

## Glossary

- **Document**: The generic persistent editable content managed by the Editor Engine.
- **Board**: A bounded visual planning canvas built as a specialization of a Document.
- **Football Board**: A football-specific Board configured with football frames, dimensions, objects, and coach-facing workflows.
- **Timeline**: A generic future Document concept for frame-based or step-based change over time.
- **Timeline Frame**: A generic future point or step in a Timeline.
- **Board Sequence**: A board-specific presentation of a Timeline for animation or step-based playback across Board states.
- **Coach Workflow**: The end-user experience of creating, editing, and presenting tactical boards for coaching use cases. This guides sport-specific product layers rather than the core Engine.
- **Football Example**: The first concrete football editor used to pressure-test the Editor Engine and board-specific layers. It is not disposable demo code.
- **Host App**: An application that embeds the Tactical Board library and configures it for a specific use case, sport, or product experience.
- **Theme**: A Board configuration package that turns generic board state into a concrete board experience by providing frames, object catalogs, renderers, visual skins, and defaults.
- **Theme Data**: The serializable portion of a Theme that can be saved, loaded, shared, or customized without embedding runtime functions.
- **Asset**: A serializable reference to visual media used by a Board Object or Theme Definition, resolved by the Host App or runtime before rendering.
- **Catalog**: A Theme-provided collection of available board definitions that editor UI may expose to users.
- **Definition**: A Theme-provided description of an available board thing such as a frame, equipment item, object kind, or visual skin.
- **Player Group**: A board-level player grouping used to provide optional shared defaults for player instances (for example, group name, color strategy, label behavior, or size).
- **Group Identity**: The optional player metadata key that links a Player to a Player Group.
- **Player Group Order**: An optional ordered list of Player Group IDs used by the Coach Workflow to render groups consistently in UI surfaces.
- **Player Group Preset**: A user-facing group entry in the Player Group toolbar, typically represented by a default color and optional style/name.
- **Player Appearance Color**: A named color role used by a Player Appearance, where built-in and custom appearances decide which roles they understand.
- **Player Appearance Option**: A serializable configuration value for a Player Appearance that is neither its identity, colors, nor media asset.
- **Player Appearance Catalog**: A Theme- or Host App-provided collection of available Player Appearances and their configuration metadata.
- **Preset**: A reusable shortcut that creates or applies a preconfigured Board state, object, or style from one or more Definitions.
- **Document Schema**: The explicit serialized JSON shape for a Document. The Editor Engine may offer validation helpers, while migration policy and persistence handling remain Host App responsibilities.
- **Board Schema**: A board-specific profile of the Document Schema for tactical-board content.
- **Board Editor**: A board-specific editor layer built on top of the generic Editor Engine.
- **Shape**: A placed entity in a Document with shared editing behavior such as selection, movement, layering, and serialization.
- **Board Object**: A board-specific Shape with planning-board meaning.
- **Board Renderer**: The non-editing rendering capability used to display a Board in read-only contexts such as thumbnails, lists, previews, and exports.
- **Shape Definition**: The per-type definition that supplies shape-specific behavior such as default properties, geometry, hit-testing, bounds, and render hooks while the Canvas Renderer retains ownership of the draw loop and viewport concerns.
- **Editor Store**: The framework-independent source of truth for editing state and operations. React subscribes to the Editor Store rather than owning editing state directly.
- **Editor Engine**: The framework-independent core that defines Document state, editing operations, geometry contracts, object dispatch, and serialization rules. The Editor Engine does not own React UI concerns or canvas drawing details.
- **React Adapter**: The React integration layer that subscribes to the Editor Store, wires DOM input to Tools, and renders editor UI without owning canonical Document state.
- **Document Background**: The generic base visual and coordinate setup for a Document.
- **Document Unit**: The declared measurement unit for a Document coordinate space, such as pixels or meters. The Editor Engine uses it for scale and conversion without assigning domain meaning to the unit.
- **Board Frame**: The bounded board area that defines coordinate size, base visuals, and optional domain markings such as field or court lines.
- **Board Library**: The reusable board editor library developed in this repository. It must be embeddable across multiple Host Apps while supporting sport-specific workflows such as tactics, game plans, and practice drills.
- **Canvas Renderer**: The rendering layer that paints Document or Board state to HTML canvas for editing and read-only display. It consumes Editor Engine data rather than defining editing rules itself.
- **Tool**: An interaction module that interprets user input and invokes Editor Engine operations. Tools may own temporary interaction state, but persistent Document mutations belong to the Editor Engine rather than the Tool itself.
- **Standard Tool**: A reusable generic Tool, such as Select, Hand, Shape, Arrow, or Text, that is provided outside the Editor Engine and registered by an editor instance.
- **Default Tool**: The configured fallback Tool for an editor instance. The Editor Engine stores the default tool id but does not know which Tool, such as Select, fills that role.
- **React UI Copy**: User-facing labels, aria labels, tooltips, and menu text owned by the React Adapter rather than by the Editor Engine, Tool registrations, Theme data, or Host App data.
- **Selection**: The editor-session set of Shapes currently targeted for editing. Tools may change Selection or decide how to present it, but Selection is not owned by any specific Tool.
- **Smart Guides**: Temporary editor-session assistance that helps a user place, align, size, or constrain Shapes while interacting with a Document.
- **Guide**: A visual hint shown for a possible or active Smart Guides target, distinct from a persistent visual grid.
- **Guide Target**: A Shape, Board Frame boundary, or Theme-provided Board Frame marking that Smart Guides may use for placement assistance.
- **Snap**: The adjustment of an in-progress interaction to a nearby Guide target.
- **Selection Bounds**: The aggregate bounds of the current Selection when it is treated as one editable unit.
- **Shape Skin**: A visual representation of a Shape that can change without changing the shape's meaning or serialized identity.
- **Player**: A Board Object representing a player or participant on a Board; in the board layer, a Player is an object kind rather than a separate domain aggregate.
- **Player Appearance**: A player-specific Shape Skin that controls how Players are visually represented, such as a circle, kit, patterned marker, pixel-art figure, or custom media.
- **Player Appearance Color**: A named color role used by a Player Appearance, where built-in and custom appearances decide which roles they understand.
- **Player Appearance Option**: A serializable configuration value for a Player Appearance that is neither its identity, colors, nor media asset.
- **Player Appearance Catalog**: A Theme- or Host App-provided collection of available Player Appearances and their configuration metadata.
- **Player Marker Label**: A short label rendered as part of a Player's marker or appearance, typically a number or compact role abbreviation.
- **Player Caption**: Longer text associated with a Player and positioned around the player marker, typically used for names or readable role notes.
- **Equipment Object**: A Board Object representing placeable training or game equipment whose name and visual appearance may be extended by a Theme or Host App.
- **Shape Index**: The canonical internal storage shape for Shapes inside the Editor Engine: a map keyed by shape id plus a separate ordering list.
- **Export Primitive**: A low-level Board Library capability that turns Board data into a portable representation, such as serialized JSON or a rendered image, without deciding where the result is stored or shared.
- **Share Workflow**: A Host App workflow that chooses product-specific sharing behavior such as uploads, short links, deep links, native share sheets, WhatsApp links, permissions, analytics, or server-side rendering.

## Relationships

- **Smart Guides** treat a multi-Shape **Selection** through its **Selection Bounds** and exclude Shapes inside that Selection from the active set of **Guide Targets**.
- The **Board Library** may provide reusable **Export Primitives**, while **Share Workflows** belong to the **Host App** because storage, privacy, URLs, channels, and analytics are product-specific.
- A **Host App** may compose custom save, export, or share controls with Board Library toolbar primitives instead of using a prescribed Board Library toolbar.
- **React UI Copy** is localized through the React Adapter labels provider only when the copy is owned by React UI. Labels carried by **Tool** registrations, **Theme** definitions, frame variant options, equipment definitions, or Host App-provided presets remain owned by that data and should not be overwritten by the provider.
- Built-in toolbar presets should prefer stable ids or values for behavior and resolve their display text at the React rendering boundary. If a Host App supplies a custom preset label or tooltip, that caller-owned copy takes precedence.
- **Numeric player labels** are scoped to a Player Group when `groupId` is set, so labels can reuse across groups; players without a group use existing legacy color/global sequencing for backward compatibility.
- A **Player Group** provides default styling and **Player Appearance** choices for its member **Players**, while an individual **Player** may override those defaults when a specific participant needs a different visual representation.
- A **Player Appearance** is selected by a stable identity in board data, while the rendering behavior for that appearance belongs to a **Theme** or **Host App**.
- A single player color remains the fallback for simple appearances, while richer **Player Appearances** may use any number of named **Player Appearance Colors**.
- The Board model does not prescribe **Player Appearance Color** names; each **Player Appearance** may define the color roles its renderer understands.
- A **Player Appearance Catalog** may define color-role metadata for editor controls, while **Players** and **Player Groups** store only the selected color values.
- The Board model does not prescribe **Player Appearance Option** names; each **Player Appearance** may define the options its renderer understands.
- A **Player Appearance** may use an **Asset**, but media remains a separate Board value so the same asset concept can serve objects, themes, and host-provided rendering.
- A Player without an explicit **Player Appearance** uses the built-in circle appearance for backward-compatible rendering.
- Built-in kit or marker patterns are modeled as distinct **Player Appearances** rather than as a required variant system in Board data.
- A **Player Marker Label** belongs to the Player's visible marker, while a **Player Caption** is first-class player text placed outside the marker for readability.
- A **Player Caption** uses a simple placement around the marker, such as top, right, bottom, or left, with optional distance from the marker.
- **Player Appearances** own marker visuals and **Player Marker Label** rendering, while **Player Captions** use common player rendering behavior across appearances.
- A **Player Group** may provide default **Player Caption** styling and placement, while each **Player** owns its caption text and may override those defaults.
- A **Player Caption** is part of its **Player** for selection, hit testing, movement, and visible bounds.
- In this v1 Coach Workflow, deleting a Player Group is a destructive action on its members: players assigned to that group are removed from the board alongside the group definition.
- A board must always retain at least one Player Group; deleting the final remaining group is disallowed.
- If a deletion request for the last remaining Player Group is made despite UI safeguards, it is treated as a no-op.
- New boards should start with two Player Group Presets by default, each seeded from the first available colors in the shared color-order list used by the Color Picker.
- Adding a Player Group Preset in v1 uses the next unused color from that same color-order list.
- When all preset colors are already in use, new Player Group Presets fall back to the next color in the shared color-order sequence (wrapping as needed).

## Testing Policy

Tests should protect important behavior at meaningful module interfaces, not document every helper, constant, catalog entry, object size, or visual tuning value. Prefer adding tests when a behavior is central to the Editor Engine, public React Adapter, Board Library contract, serialization compatibility, architecture rule, or a regression-prone Coach Workflow.

Do not add tests just because a file or function exists. Avoid tests that only assert arithmetic pass-throughs, default dimensions, icon color choices, preset order, or other low-risk implementation details unless those details have caused repeated regressions or are part of a documented public contract.

When coverage is needed, test through the deepest useful module interface: editor interactions, Editor Store operations, Tool behavior, rendering contracts, public exports, or compatibility seams. Small helper tests are acceptable only when the helper hides non-obvious rules that would otherwise be hard to exercise through a higher-level interface.
