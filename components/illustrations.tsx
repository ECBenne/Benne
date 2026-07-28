export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f9d63" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0f9d63" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0fdf6" />
        </linearGradient>
        <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>

      <ellipse cx="200" cy="170" rx="180" ry="150" fill="url(#blob)" />

      {/* document / form card */}
      <g transform="translate(110 60)">
        <rect x="0" y="0" width="150" height="200" rx="18" fill="url(#card)" stroke="#0c7e4f" strokeOpacity="0.15" strokeWidth="2" />
        <rect x="24" y="30" width="70" height="10" rx="5" fill="#0f9d63" opacity="0.85" />
        <rect x="24" y="54" width="102" height="8" rx="4" fill="#d1fae5" />
        <rect x="24" y="72" width="80" height="8" rx="4" fill="#d1fae5" />
        <rect x="24" y="98" width="102" height="34" rx="8" fill="#ecfdf5" stroke="#0f9d63" strokeOpacity="0.3" />
        <rect x="24" y="146" width="60" height="8" rx="4" fill="#d1fae5" />
        <rect x="24" y="164" width="102" height="8" rx="4" fill="#d1fae5" />

        {/* checkmark badge */}
        <circle cx="126" cy="176" r="22" fill="#0f9d63" />
        <path d="M116 176l7 7 14-14" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* floating coin */}
      <g transform="translate(280 70)">
        <circle cx="0" cy="0" r="26" fill="url(#coin)" />
        <text x="0" y="7" textAnchor="middle" fontSize="22" fontWeight="700" fill="#7c5a00">
          €
        </text>
      </g>

      {/* small coin */}
      <circle cx="60" cy="230" r="16" fill="url(#coin)" opacity="0.9" />
      <text x="60" y="235" textAnchor="middle" fontSize="14" fontWeight="700" fill="#7c5a00">
        €
      </text>

      {/* sparkles */}
      <path d="M320 190 l4 10 10 4 -10 4 -4 10 -4-10-10-4 10-4z" fill="#0f9d63" opacity="0.5" />
      <path d="M70 90 l3 7 7 3 -7 3 -3 7 -3-7-7-3 7-3z" fill="#0f9d63" opacity="0.4" />
    </svg>
  );
}

export function CelebrationIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cel-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f9d63" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0f9d63" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="80" r="76" fill="url(#cel-bg)" />
      <circle cx="100" cy="80" r="40" fill="#0f9d63" />
      <path d="M84 80l11 11 22-22" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {[
        [30, 40, "#facc15"],
        [170, 50, "#f472b6"],
        [40, 130, "#60a5fa"],
        [165, 120, "#0f9d63"],
        [100, 20, "#f472b6"],
        [20, 90, "#facc15"],
      ].map(([x, y, color], i) => (
        <rect
          key={i}
          x={Number(x)}
          y={Number(y)}
          width="8"
          height="8"
          rx="2"
          fill={String(color)}
          transform={`rotate(${i * 37} ${Number(x) + 4} ${Number(y) + 4})`}
        />
      ))}
    </svg>
  );
}

export function ThinkingIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="think-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="80" r="76" fill="url(#think-bg)" />
      <circle cx="100" cy="80" r="40" fill="#f59e0b" />
      <rect x="82" y="60" width="36" height="6" rx="3" fill="white" />
      <rect x="82" y="76" width="36" height="6" rx="3" fill="white" opacity="0.85" />
      <rect x="82" y="92" width="22" height="6" rx="3" fill="white" opacity="0.7" />
    </svg>
  );
}
