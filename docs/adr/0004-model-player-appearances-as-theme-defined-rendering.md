# Model player appearances as theme-defined rendering

Player visuals are **Player Appearances** selected by stable identity in Board data. A Theme or Host App owns the appearance catalog, color roles, options, and rendering behavior, keeping the Board Schema sport-agnostic and open to custom renderers.

The built-in circle is the fallback when no appearance is selected. Player Group inheritance is defined separately in ADR 0005.

A **Player Marker Label** is part of the appearance; a **Player Caption** is common Player behavior outside the marker and participates in movement, selection, hit testing, and visible bounds.
