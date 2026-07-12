import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import {
  isBoardPlayerGroupAutoNumberingEnabled,
  resolvePlayerGroupStyle,
} from "../../../core/board/player-groups";
import { getContrastingPlayerLabelColor } from "../../../core/tools/player-tool";
import { DEFAULT_PLAYER_FONT_SIZE } from "../../../core/objects/player-object";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { useBoardEditorLabels } from "../editor/board-editor-labels";
import { PlayerLabelFields } from "../player/player-label-fields";
import {
  applyPlayerGroupStylePatch,
  setPlayerGroupAutoNumberingCommand,
} from "./player-team-commands";
import { useBoardEditorTeamPanelActiveGroup } from "./team-panel";
import {
  TeamPanelSection,
  TeamPanelSectionTitle,
  type TeamPanelSectionProps,
} from "./team-panel-section";

export type TeamPanelPlayerLabelSectionProps = TeamPanelSectionProps;

export function TeamPanelPlayerLabelSection(
  props: TeamPanelPlayerLabelSectionProps,
) {
  const labels = useBoardEditorLabels();
  const { group, toolApi } = useBoardEditorTeamPanelActiveGroup();
  const style = resolvePlayerGroupStyle(group);
  const hasCustomLabelStyle =
    style.fontSize !== DEFAULT_PLAYER_FONT_SIZE ||
    style.labelColor !== undefined;

  return (
    <TeamPanelSection {...props}>
      <div className="flex min-h-4 items-center justify-between">
        <TeamPanelSectionTitle>
          {labels.teamPanel.playerLabel}
        </TeamPanelSectionTitle>
        {hasCustomLabelStyle ? (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={labels.teamPanel.resetPlayerLabel}
            title={labels.teamPanel.resetPlayerLabel}
            className="text-tb-text-secondary size-4 rounded-sm"
            iconBefore={<ArrowCounterClockwiseIcon />}
            iconSize="xs"
            onClick={() =>
              applyPlayerGroupStylePatch(toolApi, group.id, {
                fontSize: DEFAULT_PLAYER_FONT_SIZE,
                labelColor: undefined,
              })
            }
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <PlayerLabelFields
          labels={labels}
          value={{
            color:
              style.labelColor ?? getContrastingPlayerLabelColor(style.color),
            fontSize: style.fontSize,
          }}
          onChange={(patch) =>
            applyPlayerGroupStylePatch(toolApi, group.id, {
              ...(patch.color !== undefined ? { labelColor: patch.color } : {}),
              ...(patch.fontSize !== undefined
                ? { fontSize: patch.fontSize }
                : {}),
            })
          }
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-tb-text-secondary text-xs font-medium">
            {labels.teamPanel.autoNumbering}
          </span>
          <Switch
            checked={isBoardPlayerGroupAutoNumberingEnabled(group)}
            aria-label={labels.teamPanel.autoNumbering}
            onCheckedChange={(checked) =>
              setPlayerGroupAutoNumberingCommand(toolApi, group.id, checked)
            }
          />
        </div>
      </div>
    </TeamPanelSection>
  );
}

/** @deprecated Use TeamPanelPlayerLabelSection. */
export const TeamPanelDefaultsSection = TeamPanelPlayerLabelSection;
