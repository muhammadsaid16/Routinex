import React, { useId } from 'react';

/**
 * The Ledger mark.
 *
 * The shape is fixed, the colours follow the theme, so the mark belongs to
 * every palette: the tile uses the surfaces of the theme, the upper ribbon
 * the accent and the lower ribbon the ink of the theme.
 */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  const gradientId = useId();

  return (
    <svg
      viewBox="385 101 429 429"
      className={className}
      role="img"
      aria-label="Ledger"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="101" x2="0" y2="530" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ob-raised)" />
          <stop offset="1" stopColor="var(--ob-canvas)" />
        </linearGradient>
      </defs>

      <rect x="386" y="102" width="427" height="427" rx="88" fill={`url(#${gradientId})`} />

      <path
        d="M530 197 H655 C696.4 197 730 230.6 730 272 V364 H647 V306 C647 284.5 629.5 267 608 267 H530 Z"
        fill="var(--ob-gold)"
      />

      <path
        d="M530 197 L469 258 Q463 264 463 275 V357 C463 399.5 497.5 434 540 434 H650 Q662 434 671 425 L730 364 H568 C545.5 364 530 348.5 530 326 Z"
        fill="var(--ob-text)"
      />
    </svg>
  );
};
