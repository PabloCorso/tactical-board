import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { footballShowcaseBoard } from "../examples/football/football-showcase-board";
import { FootballBoardViewerCanvas } from "../react";
import { cn } from "../react/components/misc";

const footballBoardPreviewMetrics = {
  aspectRatio:
    footballShowcaseBoard.frame.width / footballShowcaseBoard.frame.height,
} as const;

export type CardProps = ComponentProps<"div">;

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("bg-surface overflow-clip rounded-xl border", className)}
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
  return <p className={cn("text-secondary text-sm", className)} {...props} />;
}

export type CardContentProps = ComponentProps<"div">;

function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)} {...props} />
  );
}

const boardCards = [
  {
    title: "Build-up pattern",
    description: "Full-pitch possession sequence with players and lanes.",
  },
  {
    title: "Final third",
    description: "Attacking actions, deliveries, and finishing options.",
  },
  {
    title: "Training setup",
    description: "Equipment layout for a repeatable session exercise.",
  },
  {
    title: "Pressing shape",
    description: "Out-of-possession roles and compactness cues.",
  },
];

function TacticalBoardCardItem({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="gap-0 p-0">
        <div
          className="relative w-full overflow-hidden rounded-t-xl bg-neutral-950"
          style={{ aspectRatio: footballBoardPreviewMetrics.aspectRatio }}
        >
          <FootballBoardViewerCanvas
            board={footballShowcaseBoard}
            fitPadding={0}
            frameClassName="h-full flex-none"
            mode="fit-content"
          />
        </div>
        <div className="flex flex-col gap-1 border-t px-4 py-3">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardContent>
    </Card>
  );
}

function TacticalBoardCard() {
  return (
    <main className="bg-screen min-h-dvh p-6">
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {boardCards.map((card) => (
          <TacticalBoardCardItem
            key={card.title}
            description={card.description}
            title={card.title}
          />
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
