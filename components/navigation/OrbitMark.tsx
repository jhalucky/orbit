export function OrbitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <ellipse
        cx="16"
        cy="16"
        rx="11"
        ry="8.6"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-38 16 16)"
      />
      <circle cx="16" cy="16" r="3.35" fill="currentColor" />
      <circle cx="24.6" cy="9.6" r="1.85" fill="currentColor" />
    </svg>
  );
}
