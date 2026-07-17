type LineStyleIconProps = {
  dashed?: boolean;
  strokeWidth?: number;
};

export function LineStyleIcon({
  dashed = false,
  strokeWidth = 2.5,
}: LineStyleIconProps) {
  const renderedStrokeWidth = Math.min(6, Math.max(1, strokeWidth));

  return (
    <span className="flex h-6 w-6 items-center justify-center">
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M4 20 L20 4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={renderedStrokeWidth}
          strokeDasharray={dashed ? `3 ${3 + renderedStrokeWidth}` : undefined}
        />
      </svg>
    </span>
  );
}
