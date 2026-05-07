# Tactical Board Context

## Glossary

- **Board**: The single editable unit managed by the Tactical Board Library. A Board contains its surface, placed objects, and editor-relevant metadata. Multi-board or multi-page workflows belong to the Host App, not the library.
- **Board Sequence**: A future higher-level concept for animation or step-based playback across multiple Board states. A Board itself remains a single static arrangement.
- **Coach Workflow**: The end-user experience of creating, editing, and presenting tactical boards for coaching use cases. This is the primary product standard for usability and interaction quality.
- **Host App**: An application that embeds the Tactical Board library and configures it for a specific use case, sport, or product experience.
- **Board Schema**: The explicit serialized JSON shape for a Board. The Tactical Board Library defines the schema and may offer validation helpers, while migration policy and persistence handling remain Host App responsibilities.
- **Board Editor**: The interactive experience for editing one Board at a time.
- **Board Object**: A placed entity on a Board with shared editing behavior such as selection, movement, layering, and serialization. Specific object kinds add their own metadata through type-specific properties.
- **Board Renderer**: The non-editing rendering capability used to display a Board in read-only contexts such as thumbnails, lists, previews, and exports.
- **Object Definition**: The per-type definition that supplies object-specific behavior such as default properties, geometry, hit-testing, bounds, and render hooks while the Canvas Renderer retains ownership of the draw loop and viewport concerns.
- **Board Editor Store**: The framework-independent source of truth for Board editing state and operations. React subscribes to the Board Editor Store rather than owning Board state directly.
- **Engine**: The framework-independent core that defines Board state, editing operations, geometry contracts, object dispatch, and serialization rules. The Engine does not own React UI concerns or canvas drawing details.
- **Surface Preset**: A reusable definition of a Board surface, including coordinate space, background appearance, and markings such as field or court lines. Surface Presets must allow sport-specific surfaces without making the core library sport-specific.
- **Tactical Board Library**: The reusable editor library developed in this repository. It must be embeddable across multiple Host Apps while remaining optimized for the Coach Workflow.
- **Canvas Renderer**: The rendering layer that paints Board state to canvas for editing and read-only display. It consumes Engine data rather than defining editing rules itself.
- **Tool**: An interaction module that interprets user input and invokes Engine editing operations. Tools may own temporary interaction state, but persistent Board mutations belong to the Engine rather than the Tool itself.
- **Object Skin**: A visual representation of a Board Object that can change without changing the object's meaning or serialized identity.
- **Player Token**: A Board Object representing a player or participant on the Board. In the core model, a Player Token is an object kind rather than a separate domain aggregate.
- **Object Index**: The canonical internal storage shape for Board Objects inside the Engine: a map keyed by object id plus a separate ordering list.
