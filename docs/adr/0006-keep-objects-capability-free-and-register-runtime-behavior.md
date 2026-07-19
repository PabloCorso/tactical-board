# Keep Objects capability-free and register runtime behavior per type

Serialized Objects will contain editable facts such as identity, type, position, size, rotation, and Object-specific props. They will not contain generic editing capability flags such as `canMove`, `canResize`, or `canRotate`, and they will not contain per-Object locking state. Movement and rotation are available by default; Object-specific geometry is expressed through transform and Selection implementation rather than boolean restrictions.

Each Object type has one instance-scoped **Object Definition**. The Object Definition owns its default ordering rank, any custom transform behavior, Selection behavior, optional editing hook, and Canvas adapter for rendering and hit testing. The Canvas Renderer still owns the draw loop and viewport concerns, consistent with ADR-0002.

Tools remain interaction modules. A Tool may create an Object, but it does not register that Object type or establish whether existing Objects can render, be selected, or be transformed. Editor configuration composes Tools and Object Definitions independently so read-only renderers and editors without a creation Tool use the same Object behavior.

Theme Data remains serializable catalog data. Theme and Host App adapters resolve that data into Object Definitions for each editor or renderer instance. Runtime catalog metadata must not be stored in module-global registries because multiple editors may use different Themes in the same process.

## Consequences

- Adding an Object type requires one runtime Object Definition plus any Tools or React UI the Host App chooses to expose.
- Objects remain lean and do not preserve obsolete capability decisions.
- Equipment and other Theme-defined behavior is isolated between editor instances.
- Host Apps that load older Documents own any one-time migration needed to remove obsolete serialized capability or locking fields.
