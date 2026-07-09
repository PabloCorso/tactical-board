import type { PlayerObject } from "../objects/player-object";
import type { CanvasObjectRenderInput } from "../rendering/canvas/types";

export const DEFAULT_PLAYER_APPEARANCE_ID = "circle";

export type PlayerAppearanceRendererInput = CanvasObjectRenderInput & {
  player: PlayerObject;
};

export type PlayerAppearanceRenderer = (
  input: PlayerAppearanceRendererInput,
) => void;

export type PlayerAppearanceRendererRegistry = Record<
  string,
  PlayerAppearanceRenderer
>;
