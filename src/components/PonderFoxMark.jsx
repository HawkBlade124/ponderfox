import { useId } from "react";

function PonderFoxMark({ size = 96, sparkle = true, className = "" }) {
  const gradientId = useId();

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="20" y1="10" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6fc6ff" />
          <stop offset="100%" stopColor="#438eef" />
        </linearGradient>
      </defs>

      <path d="M45,15 L85,88 L20,96 Z" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinejoin="round" fill="#0b102b" />
      <path d="M155,15 L115,88 L180,96 Z" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinejoin="round" fill="#0b102b" />
      <path d="M52,38 L74,80 L38,86 Z" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinejoin="round" opacity="0.6" />
      <path d="M148,38 L126,80 L162,86 Z" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinejoin="round" opacity="0.6" />

      <path
        d="M20,96 C14,142 55,176 100,179 C145,176 186,142 180,96 C165,80 134,69 100,71 C66,69 35,80 20,96 Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinejoin="round"
        fill="#0b102b"
      />

      <path d="M60,110 Q70,101 81,110" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />
      <path d="M119,110 Q130,101 140,110" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />

      <path d="M90,148 L110,148 L100,163 Z" fill={`url(#${gradientId})`} />

      {sparkle && (
        <>
          <circle cx="152" cy="42" r="4" fill="#6fc6ff" />
          <circle cx="168" cy="60" r="2.5" fill="#6fc6ff" opacity="0.7" />
          <circle cx="140" cy="24" r="2" fill="#6fc6ff" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

export default PonderFoxMark;
