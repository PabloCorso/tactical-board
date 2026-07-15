import { useBoardEditorTeamPanelActiveGroup } from "../../../board/team/team-panel";
import { applyPlayerGroupStylePatch } from "../../../board/team/player-team-commands";
import { PlayerAppearanceFields } from "../../../board/player/player-appearance-fields";
import { useBoardEditorLabels } from "../../../board/editor/board-editor-labels";
import { DEFAULT_PLAYER_COLOR } from "../../../../core/objects/player-object";
import {
  TeamPanelSection,
  TeamPanelSectionTitle,
} from "../../../board/team/team-panel-section";
import {
  FOOTBALL_PLAYER_APPEARANCES,
  FOOTBALL_PLAYER_APPEARANCE_RENDERERS,
} from "../theme/football-player-appearances";

export function FootballTeamPanelAppearance() {
  const labels = useBoardEditorLabels();
  const { group, toolApi } = useBoardEditorTeamPanelActiveGroup();

  return (
    <TeamPanelSection>
      <TeamPanelSectionTitle>
        {labels.playerAppearance.appearance}
      </TeamPanelSectionTitle>
      <PlayerAppearanceFields
        appearanceRenderers={FOOTBALL_PLAYER_APPEARANCE_RENDERERS}
        appearances={FOOTBALL_PLAYER_APPEARANCES}
        labels={labels}
        value={{
          color: group.style.color ?? DEFAULT_PLAYER_COLOR,
          colors: group.style.colors,
          size: group.style.size,
          appearanceId: group.style.appearanceId,
          options: group.style.options,
          asset: group.style.asset,
        }}
        onChange={(patch) =>
          applyPlayerGroupStylePatch(toolApi, group.id, patch)
        }
      />
    </TeamPanelSection>
  );
}
