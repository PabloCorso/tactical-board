# Model player groups as inheritable player defaults

A **Player Group** provides optional style defaults to Players that reference it through Group Identity. Players may remain ungrouped and may override individual inherited values.

**Effective Player Style** resolves built-in defaults, then Player Group defaults, then Player-owned overrides. Player overrides use the existing optional Player fields: an absent value inherits, while a present value overrides. There is no parallel override container.

This is live inheritance rather than copying Player Group values into each Player. Changing a group default therefore updates inheriting Players without overwriting intentional Player overrides. Theme or workflow defaults may seed Player Group or Player data during creation, but they are not a separate layer in Effective Player Style resolution.

Grouping remains optional in the Board model. Sport-specific React UI Copy may present a Player Group as a team, side, squad, or group.
