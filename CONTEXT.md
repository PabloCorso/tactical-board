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
- **Selection**: The editor-session set of Shapes currently targeted for editing. Tools may change Selection or decide how to present it, but Selection is not owned by any specific Tool.
- **Shape Skin**: A visual representation of a Shape that can change without changing the shape's meaning or serialized identity.
- **Player Token**: A Board Object representing a player or participant on a Board. In the board layer, a Player Token is an object kind rather than a separate domain aggregate.
- **Shape Index**: The canonical internal storage shape for Shapes inside the Editor Engine: a map keyed by shape id plus a separate ordering list.
