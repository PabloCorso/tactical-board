# Keep Objects capability-free and register runtime behavior per type

Serialized Objects contain editable facts, not capability flags or per-Object locking state. Movement and rotation are defaults; type-specific geometry belongs to the Object Definition.

Each Object type has one instance-scoped **Object Definition** for ordering, transforms, Selection behavior, editing hooks, rendering, and hit testing. The Canvas Renderer retains the draw loop and viewport.

Tools and Object Definitions are configured independently. A Tool may create or interact with an Object, but does not register its type; editors and read-only renderers therefore share the same Object behavior.

Themes and Host Apps resolve serializable Theme Data into Object Definitions per editor or renderer instance; runtime behavior is not stored in Documents or module-global registries.
