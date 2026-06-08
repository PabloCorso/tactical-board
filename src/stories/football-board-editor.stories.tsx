import type { Meta, StoryObj } from "@storybook/react-vite";
import { footballShowcaseBoard } from "../examples/football/football-showcase-board";
import { FootballBoardEditorExample } from "./examples/football-board-editor.example";
import {
  createFootballPitch,
  FootballPitchPreview,
  type BoardEditorLabelOverrides,
  type FootballPitchVariant,
} from "../react";

const meta = {
  title: "React/Board Editor/Football",
  component: FootballBoardEditorExample,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Interactive reference for composing the React board editor with a football-specific board document, tools, defaults, toolbar workflow, icons, and canvas renderers.",
      },
    },
  },
} satisfies Meta<typeof FootballBoardEditorExample>;

export default meta;

type Story = StoryObj<typeof meta>;

const frameComparisonScale = 0.5;
const fullPitchFrame = createFootballPitch("full-pitch");
const halfPitchFrame = createFootballPitch("half-pitch");
const reducedSpaceFrame = createFootballPitch("reduced-space");

export const EmptyBoard: Story = {};

export const ShowcaseBoard: Story = {
  args: {
    initialBoard: footballShowcaseBoard,
  },
};

const spanishPitchLabels: Record<FootballPitchVariant, string> = {
  "full-pitch": "Campo completo",
  "half-pitch": "Medio campo",
  "reduced-space": "Espacio reducido",
};

const spanishEditorLabels = {
  canvasToolbar: {
    enterFullScreen: "Pantalla completa",
    fitToView: "Ajustar vista",
    redo: "Rehacer",
    undo: "Deshacer",
    zoomIn: "Acercar",
    zoomLevel: "Nivel de zoom",
    zoomOut: "Alejar",
  },
  colorPicker: {
    chooseCustomColor: "Elegir color personalizado",
  },
  selectionActions: {
    bringToFront: "Traer al frente",
    delete: "Eliminar",
    duplicate: "Duplicar",
    moreActions: "Mas acciones",
    sendToBack: "Enviar atras",
  },
  secondaryToolbar: {
    arrowDefaults: {
      dribble: "Conduccion",
      line: "Linea",
      loftedPass: "Pase elevado",
      run: "Carrera",
      screen: "Bloqueo",
    },
    playerColor: "Color del jugador",
    shapeDefaults: {
      diamond: "Rombo",
      oval: "Ovalo",
      polygon: "Poligono",
      rectangle: "Rectangulo",
      triangle: "Triangulo",
    },
  },
  selectionToolbar: {
    arrowBodyOption: (label) => `Cuerpo de flecha: ${label}`,
    arrowBodyStyle: "Estilo del cuerpo de flecha",
    arrowColor: "Color de flecha",
    arrowHead: {
      arrow: "Flecha",
      none: "Ninguna",
    },
    arrowHeadOption: (side, label) =>
      `${side === "left" ? "Punta izquierda" : "Punta derecha"}: ${label}`,
    arrowLeftHead: "Punta izquierda",
    arrowLineOption: (label) => `Linea de flecha: ${label}`,
    arrowLineStyle: "Estilo de linea de flecha",
    arrowRightHead: "Punta derecha",
    arrowStyle: {
      curved: "Curva",
      double: "Doble",
      straight: "Recta",
      wavy: "Ondulada",
    },
    border: "Borde",
    color: "Color",
    equipmentColor: "Color del material",
    fillStyle: "Relleno",
    lineStyle: "Linea",
    lineValue: {
      dashed: "Discontinua",
      solid: "Solida",
    },
    playerColor: "Color del jugador",
    playerLabel: "Etiqueta del jugador",
    shapeBorderOption: (label) => `Borde de forma: ${label}`,
    shapeBorderStyle: "Estilo de borde",
    shapeBorderValue: {
      bordered: "Con borde",
      borderless: "Sin borde",
    },
    shapeColor: "Color de forma",
    shapeFillOption: (label) => `Estilo de forma: ${label}`,
    shapeFillStyle: "Estilo de relleno",
    shapeFillValue: {
      none: "Ninguno",
      solid: "Solido",
      stripes: "Rayas",
    },
    shapeLineOption: (label) => `Linea de forma: ${label}`,
    shapeLineStyle: "Estilo de linea",
    textColor: "Color de texto",
    textSize: "Tamano de texto",
  },
  textEditor: {
    ariaLabel: "Editor de texto",
  },
} satisfies BoardEditorLabelOverrides;

export const SpanishLabels: Story = {
  args: {
    initialBoard: footballShowcaseBoard,
    labels: spanishEditorLabels,
    translatePitchLabel: (value) => spanishPitchLabels[value],
    translateRotatePitchAction: () => ({
      buttonLabel: "Girar",
      label: "Girar campo",
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Example of translating built-in editor copy with the labels API while keeping pitch variant labels caller-owned.",
      },
    },
  },
};

export const ContainedNavigation: Story = {
  args: {
    initialBoard: footballShowcaseBoard,
    navigationMode: "contained",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Football editor with contained navigation: zooming is allowed, but pan and scroll stay constrained to the fit-to-view pitch frame.",
      },
    },
  },
};

export const Pitches: Story = {
  parameters: {
    layout: "centered",
  },
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-end gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">Full pitch</div>
          <FootballPitchPreview
            className="rounded-md"
            height={fullPitchFrame.height * frameComparisonScale}
            variant="full-pitch"
            width={fullPitchFrame.width * frameComparisonScale}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">Half pitch</div>
          <FootballPitchPreview
            className="rounded-md"
            height={halfPitchFrame.height * frameComparisonScale}
            variant="half-pitch"
            width={halfPitchFrame.width * frameComparisonScale}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">Reduced space</div>
          <FootballPitchPreview
            className="rounded-md"
            height={reducedSpaceFrame.height * frameComparisonScale}
            variant="reduced-space"
            width={reducedSpaceFrame.width * frameComparisonScale}
          />
        </div>
      </div>
    </div>
  ),
};
