import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createFootballBoard,
  createFootballPitch,
  FOOTBALL_FULL_PITCH_ASPECT_RATIO,
  type FootballPitchVariant,
  FootballBoardViewerCanvas,
} from "../react";
import { cn } from "../react/ui/misc";

const BOARD_CARD_PREVIEW_ASPECT_RATIO = FOOTBALL_FULL_PITCH_ASPECT_RATIO;

export type CardProps = ComponentProps<"div">;

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border-tb-border-default bg-tb-background-surface overflow-clip rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}

export type CardTitleProps = ComponentProps<"h2">;

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h2
      className={cn("text-base leading-snug font-medium", className)}
      {...props}
    />
  );
}

export type CardDescriptionProps = ComponentProps<"p">;

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p className={cn("text-tb-text-secondary text-sm", className)} {...props} />
  );
}

export type CardContentProps = ComponentProps<"div">;

function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)} {...props} />
  );
}

const boardCards = [
  {
    id: "build-up-pattern",
    pitch: "full-pitch",
    title: "Build-up pattern",
    description: "Full-pitch possession sequence with players and lanes.",
  },
  {
    id: "final-third",
    pitch: "half-pitch",
    title: "Final third",
    description: "Attacking actions, deliveries, and finishing options.",
  },
  {
    id: "training-setup",
    pitch: "reduced-space",
    title: "Training setup",
    description: "Equipment layout for a repeatable session exercise.",
  },
  {
    id: "pressing-shape",
    pitch: "full-pitch",
    title: "Pressing shape",
    description: "Out-of-possession roles and compactness cues.",
  },
  {
    id: "build-up-pattern-half",
    pitch: "half-pitch",
    title: "Build-up pattern",
    description: "Full-pitch possession sequence with players and lanes.",
  },
  {
    id: "final-third-reduced-space",
    pitch: "reduced-space",
    title: "Final third",
    description: "Attacking actions, deliveries, and finishing options.",
  },
] as const;

type BoardCard = {
  description: string;
  id: string;
  pitch: FootballPitchVariant;
  title: string;
};

function TacticalBoardCardItem({ description, id, pitch, title }: BoardCard) {
  const board = createFootballBoard({
    id: `football-card-${id}`,
    name: title,
    frame: createFootballPitch(pitch),
  });

  return (
    <Card className="shadow-sm">
      <CardContent className="gap-0 p-0">
        <div
          className="relative w-full overflow-hidden rounded-t-xl bg-zinc-950"
          style={{ aspectRatio: BOARD_CARD_PREVIEW_ASPECT_RATIO }}
        >
          <FootballBoardViewerCanvas
            board={board}
            fitPadding={8}
            frameClassName="h-full flex-none"
            mode="fit-content"
          />
        </div>
        <div className="border-tb-border-default flex flex-col gap-1 border-t px-4 py-3">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardContent>
    </Card>
  );
}

function TacticalBoardCard() {
  return (
    <main data-tactical-board className="bg-tb-background-screen min-h-dvh p-6">
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {boardCards.map((card) => (
          <TacticalBoardCardItem key={card.id} {...card} />
        ))}
      </div>
    </main>
  );
}

const meta = {
  title: "React/Board Card/Football",
  component: TacticalBoardCard,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A tactical board preview composed inside a card-like shell for embedding board views in product UI.",
      },
    },
  },
} satisfies Meta<typeof TacticalBoardCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ShowcaseBoard: Story = {};
