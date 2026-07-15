import type { PlayerGroup } from "../../../../core/board/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../ui/tooltip";
import { useBoardEditorLabels } from "../board-editor-labels";

export type PlayerTeamSelectionControlProps = {
  mixed?: boolean;
  onValueChange: (groupId: string) => void;
  playerGroups: PlayerGroup[];
  value?: string;
};

export function PlayerTeamSelectionControl({
  mixed = false,
  onValueChange,
  playerGroups,
  value,
}: PlayerTeamSelectionControlProps) {
  const labels = useBoardEditorLabels();
  const playerGroup = playerGroups.find((group) => group.id === value);
  const displayedValue = mixed
    ? labels.selectionToolbar.playerTeamMixed
    : (playerGroup?.name ?? labels.selectionToolbar.playerTeam);

  return (
    <Select
      value={mixed ? "" : (value ?? "")}
      onValueChange={(nextValue) => {
        if (typeof nextValue === "string" && nextValue) {
          onValueChange(nextValue);
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger>
          <SelectTrigger
            aria-label={labels.selectionToolbar.playerTeam}
            className="h-8 w-auto max-w-32 rounded-lg px-2.5 text-xs"
          >
            {() => <span className="truncate">{displayedValue}</span>}
          </SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>{labels.selectionToolbar.playerTeam}</TooltipContent>
      </Tooltip>
      <SelectContent>
        {playerGroups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            <span
              aria-hidden="true"
              className="border-tb-border-default size-3 shrink-0 rounded-full border"
              style={{ backgroundColor: group.style.color }}
            />
            <span className="truncate">{group.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
