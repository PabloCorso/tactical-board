import { CrosshairSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { getPlayerGroupRosterObjects } from "../../../core/board/player-groups";
import {
  updatePlayerObject,
  type PlayerObject,
} from "../../../core/objects/player-object";
import { Button } from "../../ui/button";
import { useDoubleCheck } from "../../ui/use-double-check";
import { Input } from "../../ui/input";
import { cn } from "../../ui/misc";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import type { PlayerAppearanceFieldValue } from "../player/player-appearance-utils";
import { PlayerCaptionFields } from "../player/player-caption-fields";
import {
  applyPlayerGroupStylePatch,
  deletePlayerGroupCommand,
  type PlayerGroupStylePatch,
} from "./player-team-commands";
import {
  TeamPanelSection,
  TeamPanelSectionTitle,
  type TeamPanelSectionProps,
} from "./team-panel-section";
import { useBoardEditorTeamPanelActiveGroup } from "./team-panel";

export function TeamPanelRosterSection() {
  const labels = useBoardEditorLabels();
  const { board, group, onLocatePlayer, toolApi } =
    useBoardEditorTeamPanelActiveGroup();
  const members = getPlayerGroupRosterObjects(board, group.id);
  const updateMember = (
    member: PlayerObject,
    input: Parameters<typeof updatePlayerObject>[1],
  ) => {
    toolApi.updateObjects([member.id], (object) =>
      updatePlayerObject(object as PlayerObject, input),
    );
  };

  if (members.length === 0) {
    return null;
  }

  return (
    <TeamPanelSection>
      <TeamPanelSectionTitle>{labels.teamPanel.roster}</TeamPanelSectionTitle>
      <div className="flex flex-col gap-1">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-1.5">
            <Input
              aria-label={labels.teamPanel.playerNumber}
              className="h-6 rounded-md px-1.5 text-center text-sm md:text-sm"
              wrapperProps={{ className: "w-10 shrink-0" }}
              value={member.props.label ?? ""}
              onChange={(event) =>
                updateMember(member, { label: event.currentTarget.value })
              }
            />
            <Input
              aria-label={labels.teamPanel.playerName}
              className="h-6 rounded-md px-2 text-sm md:text-sm"
              wrapperProps={{ className: "min-w-0 flex-1" }}
              value={member.props.caption?.text ?? ""}
              onChange={(event) =>
                updateMember(member, {
                  caption: {
                    ...member.props.caption,
                    text: event.currentTarget.value,
                  },
                })
              }
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={labels.teamPanel.selectPlayerOnBoard}
              className="text-tb-text-secondary h-6 w-6 shrink-0 rounded-md"
              iconBefore={<CrosshairSimpleIcon />}
              iconSize="xs"
              onClick={() => {
                toolApi.resetTool();
                toolApi.setSelectedObjectIds([member.id]);
                onLocatePlayer?.();
              }}
            />
          </div>
        ))}
      </div>
    </TeamPanelSection>
  );
}

export type TeamPanelCaptionSectionProps = TeamPanelSectionProps;

export function TeamPanelCaptionSection(props: TeamPanelCaptionSectionProps) {
  const labels = useBoardEditorLabels();
  const { group, toolApi } = useBoardEditorTeamPanelActiveGroup();

  const updateGroupStyle = (patch: Partial<PlayerAppearanceFieldValue>) => {
    applyPlayerGroupStylePatch(
      toolApi,
      group.id,
      patch as PlayerGroupStylePatch,
    );
  };

  return (
    <TeamPanelSection {...props}>
      <TeamPanelSectionTitle>
        {labels.teamPanel.captionDefaults}
      </TeamPanelSectionTitle>
      <div className="flex flex-col gap-1.5">
        <PlayerCaptionFields
          caption={group.style.caption ?? {}}
          labels={labels}
          onChange={(caption) => updateGroupStyle({ caption })}
        />
      </div>
    </TeamPanelSection>
  );
}

export type TeamPanelDeleteSectionProps = TeamPanelSectionProps;

export function TeamPanelDeleteSection(props: TeamPanelDeleteSectionProps) {
  const labels = useBoardEditorLabels();
  const { group, groups, toolApi } = useBoardEditorTeamPanelActiveGroup();
  const { doubleCheck: confirmingDelete, getButtonProps } = useDoubleCheck();

  if (groups.length <= 1) {
    return null;
  }

  return (
    <TeamPanelSection className="px-2 py-1.5" {...props}>
      <Button
        variant={confirmingDelete ? "danger" : "ghost"}
        size="sm"
        className={cn("-mx-1", { "text-tb-danger": !confirmingDelete })}
        iconBefore={<TrashIcon />}
        iconSize="sm"
        {...getButtonProps({
          onClick: () => deletePlayerGroupCommand(toolApi, group.id),
        })}
      >
        {confirmingDelete
          ? labels.teamPanel.confirmDeleteTeam
          : labels.teamPanel.deleteTeam}
      </Button>
    </TeamPanelSection>
  );
}
