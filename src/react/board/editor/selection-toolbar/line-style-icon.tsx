type LineStyleIconProps = {
  dashed?: boolean;
};

export function LineStyleIcon({ dashed = false }: LineStyleIconProps) {
  return (
    <span className="flex h-6 w-6 items-center justify-center">
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M2 12 H22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
          strokeDasharray={dashed ? "3 3" : undefined}
        />
      </svg>
    </span>
  );
}
