import type { BoardTheme } from "../../../board/theme/board-theme";
import { createEquipmentObjectAdapter } from "../../../board/theme/equipment-object-adapter";
import { resolveBoardTheme } from "../../../board/theme/resolve-board-theme";
import { EQUIPMENT_OBJECT_TYPE } from "../../../../core/objects/equipment-object";
import { createFootballPitch } from "../board/football-board";
import {
  FOOTBALL_EQUIPMENT_DEFINITIONS,
  FOOTBALL_EQUIPMENT_RENDERERS,
} from "../equipment";

export const footballTheme = {
  id: "football",
  name: "Football",
  frames: [
    createFootballPitch("full-pitch"),
    createFootballPitch("half-pitch"),
    createFootballPitch("reduced-space"),
  ],
  objects: FOOTBALL_EQUIPMENT_DEFINITIONS.map((definition) => ({
    type: EQUIPMENT_OBJECT_TYPE,
    kind: definition.kind,
    label: definition.label,
    defaultSize: definition.defaultSize,
    defaultProps: {
      color: definition.color,
    },
    capabilities: definition.capabilities,
    transformCapabilities: definition.transformCapabilities,
    lockedAspectRatio: definition.lockedAspectRatio,
    selectionBounds: definition.selectionBounds,
    selectionPaddingPx: definition.selectionPaddingPx,
    minimumHitRadiusPx: definition.minimumHitRadiusPx,
    hitTestShape: definition.hitTestShape,
  })),
} satisfies BoardTheme;

export const footballThemeAdapters = {
  objectAdapters: [createEquipmentObjectAdapter(FOOTBALL_EQUIPMENT_RENDERERS)],
};

export const resolvedFootballTheme = resolveBoardTheme({
  adapters: footballThemeAdapters,
  theme: footballTheme,
});
