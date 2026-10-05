export function HexLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="40"
      viewBox="0 0 40 40"
      width="40"
    >
      <path
        d="M20 2.5 35.5 11.25v17.5L20 37.5 4.5 28.75v-17.5L20 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M20 11.5 28 16v8l-8 4.5L12 24v-8l8-4.5Z"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}
