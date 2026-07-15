import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";

type LabelOverrides<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends object
      ? LabelOverrides<T[K]>
      : T[K];
};

export type BoardEditorLabels = {
  canvasToolbar: {
    enterFullScreen: string;
    fitToView: string;
    redo: string;
    undo: string;
    zoomIn: string;
    zoomLevel: string;
    zoomOut: string;
  };
  colorPicker: {
    chooseCustomColor: string;
  };
  selectionActions: {
    bringToFront: string;
    delete: string;
    duplicate: string;
    moreActions: string;
    sendToBack: string;
  };
  secondaryToolbar: {
    arrowDefaults: {
      cross: string;
      curved: string;
      curvedRun: string;
      dribble: string;
      double: string;
      line: string;
      pass: string;
      run: string;
      shot: string;
      straight: string;
      wavy: string;
    };
    addPlayerGroup: string;
    playerGroup: string;
    playerColor: string;
    shapeDefaults: {
      diamond: string;
      oval: string;
      polygon: string;
      rectangle: string;
      triangle: string;
    };
  };
  teamPanel: {
    backToPlayerGroups: string;
    title: string;
    applyFormation: string;
    autoNumbering: string;
    captionDefaults: string;
    close: string;
    confirmDeleteTeam: string;
    deleteTeam: string;
    formation: string;
    formationPlacement: string;
    kit: string;
    playerName: string;
    playerLabel: string;
    playerNumber: string;
    playerSize: string;
    resetPlayerLabel: string;
    resetPlayerSize: string;
    roster: string;
    selectPlayerOnBoard: string;
    teamName: string;
    teamSection: string;
    uploadImage: string;
  };
  playerAppearance: {
    appearance: string;
    caption: string;
    captionColor: string;
    captionDistance: string;
    captionPlacement: string;
    captionSize: string;
    labelColor: string;
    labelSize: string;
    captionPlacementValue: {
      bottom: string;
      left: string;
      right: string;
      top: string;
    };
    replaceVisual: string;
    visual: string;
  };
  selectionToolbar: {
    arrowProperties: string;
    arrowBodyOption: (label: string) => string;
    arrowBodyStyle: string;
    arrowColor: string;
    arrowHead: {
      arrow: string;
      none: string;
    };
    arrowHeadOption: (side: "left" | "right", label: string) => string;
    arrowLeftHead: string;
    arrowLineOption: (label: string) => string;
    arrowLineStyle: string;
    arrowRightHead: string;
    arrowStyle: {
      curved: string;
      double: string;
      straight: string;
      wavy: string;
    };
    border: string;
    captionText: string;
    color: string;
    customPlayerStyle: string;
    equipmentProperties: string;
    equipmentColor: string;
    fillStyle: string;
    lineStyle: string;
    lineValue: {
      dashed: string;
      solid: string;
    };
    playerColor: string;
    playerLabel: string;
    playerProperties: string;
    playerPhotoRemove: string;
    playerPhotoUpload: string;
    playerStyle: string;
    playerTeam: string;
    playerTeamMixed: string;
    labelText: string;
    resetAppearanceStyle: string;
    resetCaptionStyle: string;
    resetLabelStyle: string;
    resetToTeamStyle: string;
    shapeBorderOption: (label: string) => string;
    shapeBorderStyle: string;
    shapeBorderValue: {
      bordered: string;
      borderless: string;
    };
    shapeColor: string;
    shapeFillOption: (label: string) => string;
    shapeFillStyle: string;
    shapeLineStyle: string;
    shapeProperties: string;
    shapeFillValue: {
      none: string;
      solid: string;
      stripes: string;
    };
    shapeLineOption: (label: string) => string;
    strokeWidth: string;
    textColor: string;
    textProperties: string;
    textSize: string;
    selectionProperties: string;
    usingDefaultStyle: string;
    usingTeamStyle: (teamName: string) => string;
  };
  textEditor: {
    ariaLabel: string;
  };
};

export type BoardEditorLabelOverrides = LabelOverrides<BoardEditorLabels>;

export const BOARD_EDITOR_DEFAULT_LABELS: BoardEditorLabels = {
  canvasToolbar: {
    enterFullScreen: "Enter full screen",
    fitToView: "Fit to view",
    redo: "Redo",
    undo: "Undo",
    zoomIn: "Zoom in",
    zoomLevel: "Zoom level",
    zoomOut: "Zoom out",
  },
  colorPicker: {
    chooseCustomColor: "Choose custom color",
  },
  selectionActions: {
    bringToFront: "Bring to front",
    delete: "Delete",
    duplicate: "Duplicate",
    moreActions: "More actions",
    sendToBack: "Send to back",
  },
  secondaryToolbar: {
    arrowDefaults: {
      cross: "Cross",
      curved: "Curved arrow",
      curvedRun: "Curved run",
      dribble: "Dribble",
      double: "Double arrow",
      line: "Line",
      pass: "Pass",
      run: "Run",
      shot: "Shot",
      straight: "Straight arrow",
      wavy: "Wavy arrow",
    },
    addPlayerGroup: "Add team",
    playerGroup: "Team",
    playerColor: "Player color",
    shapeDefaults: {
      diamond: "Diamond",
      oval: "Oval",
      polygon: "Polygon",
      rectangle: "Rectangle",
      triangle: "Triangle",
    },
  },
  teamPanel: {
    backToPlayerGroups: "Back to teams",
    title: "Team properties",
    applyFormation: "Place players",
    autoNumbering: "Auto-number players",
    captionDefaults: "Caption",
    close: "Close team panel",
    confirmDeleteTeam: "Are you sure?",
    deleteTeam: "Delete team",
    formation: "Formation",
    formationPlacement: "Placement",
    kit: "Appearance",
    playerName: "Player name",
    playerLabel: "Label",
    playerNumber: "Player number",
    playerSize: "Size",
    resetPlayerLabel: "Reset player label",
    resetPlayerSize: "Reset player size",
    roster: "Players",
    selectPlayerOnBoard: "Select player on board",
    teamName: "Team name",
    teamSection: "Team",
    uploadImage: "Upload image",
  },
  playerAppearance: {
    appearance: "Appearance",
    caption: "Caption",
    captionColor: "Color",
    captionDistance: "Gap",
    captionPlacement: "Position",
    captionSize: "Size",
    labelColor: "Color",
    labelSize: "Size",
    captionPlacementValue: {
      bottom: "Bottom",
      left: "Left",
      right: "Right",
      top: "Top",
    },
    replaceVisual: "Replace",
    visual: "Visual",
  },
  selectionToolbar: {
    arrowProperties: "Arrow properties",
    arrowBodyOption: (label) => `Arrow body ${label}`,
    arrowBodyStyle: "Arrow body style",
    arrowColor: "Arrow color",
    arrowHead: {
      arrow: "Arrow",
      none: "None",
    },
    arrowHeadOption: (side, label) =>
      `${side === "left" ? "Left" : "Right"} arrow head ${label}`,
    arrowLeftHead: "Arrow left head",
    arrowLineOption: (label) => `Arrow line style ${label}`,
    arrowLineStyle: "Arrow line style",
    arrowRightHead: "Arrow right head",
    arrowStyle: {
      curved: "Curved",
      double: "Double",
      straight: "Straight",
      wavy: "Wavy",
    },
    border: "Border",
    captionText: "Caption text",
    color: "Color",
    customPlayerStyle: "Customized for this player",
    equipmentProperties: "Equipment properties",
    equipmentColor: "Equipment color",
    fillStyle: "Fill style",
    lineStyle: "Line style",
    lineValue: {
      dashed: "Dashed",
      solid: "Solid",
    },
    playerColor: "Player color",
    playerLabel: "Player label",
    playerProperties: "Player properties",
    playerPhotoRemove: "Remove photo",
    playerPhotoUpload: "Upload photo",
    playerStyle: "Player style",
    playerTeam: "Team",
    playerTeamMixed: "Mixed",
    labelText: "Label text",
    resetAppearanceStyle: "Reset appearance",
    resetCaptionStyle: "Reset caption style",
    resetLabelStyle: "Reset label style",
    resetToTeamStyle: "Reset to team style",
    shapeBorderOption: (label) => `Shape border ${label}`,
    shapeBorderStyle: "Shape border style",
    shapeBorderValue: {
      bordered: "Bordered",
      borderless: "Borderless",
    },
    shapeColor: "Shape color",
    shapeFillOption: (label) => `Shape style ${label}`,
    shapeFillStyle: "Shape fill style",
    shapeLineStyle: "Shape line style",
    shapeProperties: "Shape properties",
    shapeFillValue: {
      none: "None",
      solid: "Solid",
      stripes: "Stripes",
    },
    shapeLineOption: (label) => `Shape line style ${label}`,
    strokeWidth: "Stroke width",
    textColor: "Text color",
    textProperties: "Text properties",
    textSize: "Text size",
    selectionProperties: "Selection actions",
    usingDefaultStyle: "Using the default style",
    usingTeamStyle: (teamName) => `Using ${teamName} style`,
  },
  textEditor: {
    ariaLabel: "Text editor",
  },
};

const BoardEditorLabelsContext = createContext<BoardEditorLabels>(
  BOARD_EDITOR_DEFAULT_LABELS,
);

function mergeLabels<T extends object>(
  base: T,
  overrides: LabelOverrides<T>,
): T {
  const result = { ...base };

  for (const [key, value] of Object.entries(overrides) as Array<
    [keyof T, T[keyof T] | undefined]
  >) {
    if (value === undefined) {
      continue;
    }

    const baseValue = base[key];
    const nextValue =
      typeof baseValue === "object" &&
      baseValue !== null &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
        ? mergeLabels(
            baseValue as Record<string, unknown>,
            value as LabelOverrides<Record<string, unknown>>,
          )
        : value;

    (result as Record<keyof T, unknown>)[key] = nextValue;
  }

  return result;
}

export type BoardEditorLabelsProviderProps = PropsWithChildren & {
  labels?: BoardEditorLabelOverrides;
};

export function BoardEditorLabelsProvider({
  children,
  labels,
}: BoardEditorLabelsProviderProps) {
  const parentLabels = useContext(BoardEditorLabelsContext);
  const value = useMemo(
    () => (labels ? mergeLabels(parentLabels, labels) : parentLabels),
    [labels, parentLabels],
  );

  return (
    <BoardEditorLabelsContext.Provider value={value}>
      {children}
    </BoardEditorLabelsContext.Provider>
  );
}

export function useBoardEditorLabels(): BoardEditorLabels {
  return useContext(BoardEditorLabelsContext);
}
