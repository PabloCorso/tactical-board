# Model player groups as inheritable player defaults

Board state and reusable Board Library code use **Player Group** for a board-level grouping of Players. Sport-specific React UI Copy may call it a team, side, squad, or group.

A Player Group provides optional defaults to Players that reference it through Group Identity. Players may remain ungrouped or override individual inherited values.

Effective Player Style resolves built-in or Theme defaults, then Player Group defaults, then Player-owned overrides. Overrides use the existing optional Player fields; there is no parallel override container.

Grouped workflows may provide default groups, but grouping is not required by the Board model.
