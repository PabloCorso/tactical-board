import { useState } from "react";
import { useBoardEditorTeamPanelActiveGroup } from "../../../board/team/team-panel";
import { applyFormationToPlayerGroup } from "../../../board/team/player-team-commands";
import { useBoardEditorLabels } from "../../../board/editor/board-editor-labels";
import { Button } from "../../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../ui/select";
import {
  FOOTBALL_FORMATIONS,
  getFootballFormationPlacementOptions,
  type FootballFormationDefinition,
} from "../theme/football-formations";
import {
  TeamPanelSection,
  TeamPanelSectionTitle,
} from "#app/react/board/team/team-panel-section.tsx";

export type FootballTeamFormationSectionProps = {
  formations?: FootballFormationDefinition[];
};

/**
 * Football-specific Team panel section: pick a formation and place the team
 * on the pitch. Placement options follow the current frame — full pitches
 * offer halves and whole-pitch directions, half-pitches aim at their goal.
 */
export function FootballTeamFormationSection({
  formations = FOOTBALL_FORMATIONS,
}: FootballTeamFormationSectionProps) {
  const labels = useBoardEditorLabels();
  const { board, group, groupIndex, toolApi } =
    useBoardEditorTeamPanelActiveGroup();
  const placementOptions = getFootballFormationPlacementOptions(board.frame);
  const [formationId, setFormationId] = useState(formations[0]?.id ?? "");
  const [placementId, setPlacementId] = useState(
    placementOptions[Math.min(groupIndex, 1)]?.id ?? placementOptions[0]?.id,
  );

  const formation = formations.find(
    (candidate) => candidate.id === formationId,
  );
  const placement =
    placementOptions.find((candidate) => candidate.id === placementId) ??
    placementOptions[0];

  if (formations.length === 0 || placementOptions.length === 0) {
    return null;
  }

  return (
    <TeamPanelSection>
      <TeamPanelSectionTitle>
        {labels.teamPanel.formation}
      </TeamPanelSectionTitle>
      <div className="flex items-center gap-1.5">
        <Select
          value={formationId}
          onValueChange={(value) => {
            if (typeof value === "string") {
              setFormationId(value);
            }
          }}
        >
          <SelectTrigger
            aria-label={labels.teamPanel.formation}
            className="h-6 min-w-0 flex-1 rounded-md px-2 text-sm"
          >
            {() => formation?.label ?? ""}
          </SelectTrigger>
          <SelectContent>
            {formations.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {placementOptions.length > 1 ? (
        <Select
          value={placement?.id}
          onValueChange={(value) => {
            if (typeof value === "string") {
              setPlacementId(value);
            }
          }}
        >
          <SelectTrigger
            aria-label={labels.teamPanel.formationPlacement}
            className="h-6 rounded-md px-2 text-sm"
          >
            {() => placement?.label ?? ""}
          </SelectTrigger>
          <SelectContent>
            {placementOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Button
        variant="alternative"
        size="sm"
        disabled={!formation || !placement}
        onClick={() => {
          if (formation && placement) {
            applyFormationToPlayerGroup(toolApi, {
              groupId: group.id,
              layout: formation.layout,
              placement: placement.placement,
            });
          }
        }}
      >
        {labels.teamPanel.applyFormation}
      </Button>
    </TeamPanelSection>
  );
}
