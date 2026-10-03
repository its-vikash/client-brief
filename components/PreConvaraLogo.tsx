// ── PreConvara logo — SVG mark + wordmark ─────────────────────────────────────
//
// The mark is a stylised "P" formed by two overlapping conversation bubbles,
// one rotated — representing the "pre" (preparation) and the "convara"
// (conversation) meeting point.

import clsx from "clsx";

interface LogoProps {
  /** Overall size in px — the mark is square, wordmark sits to the right */
  size?: number;
  /** Show only the square mark without the wordmark */
  markOnly?: boolean;
  /** Light variant for dark backgrounds */
  light?: boolean;
  className?: string;
}

export default function PreConvaraLogo({
  size = 36,
  markOnly = false,
  light = false,
  className,
}: LogoProps) {
  const textColor = light ? "#F5F1EA" : "#304d50";
  const subColor  = light ? "rgba(245,241,234,0.55)" : "rgba(48,77,80,0.5)";

  return (
    <div className={clsx("flex items-center gap-2.5 shrink-0", className)}>
      {/* Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PreConvara mark"
      >
        {/* Rounded-square background */}
        <rect width="36" height="36" rx="10" fill="#EE8953" />

        {/* Primary bubble — large, top-left anchor */}
        <path
          d="M8 10C8 8.343 9.343 7 11 7H23C24.657 7 26 8.343 26 10V18C26 19.657 24.657 21 23 21H19L15 25V21H11C9.343 21 8 19.657 8 18V10Z"
          fill="white"
          fillOpacity="0.95"
        />

        {/* Secondary bubble — smaller, offset bottom-right, suggests reply/response */}
        <path
          d="M16 19.5C16 18.119 17.119 17 18.5 17H26C27.381 17 28.5 18.119 28.5 19.5V24.5C28.5 25.881 27.381 27 26 27H23.5V29.5L21 27H18.5C17.119 27 16 25.881 16 24.5V19.5Z"
          fill="white"
          fillOpacity="0.6"
        />

        {/* "P" dot — accent mark inside primary bubble */}
        <circle cx="13" cy="14" r="1.4" fill="#EE8953" />
        <circle cx="17" cy="14" r="1.4" fill="#EE8953" />
        <circle cx="21" cy="14" r="1.4" fill="#EE8953" />
      </svg>

      {/* Wordmark */}
      {!markOnly && (
        <div className="leading-none">
          <span
            style={{
              fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: size * 0.42,
              color: textColor,
              letterSpacing: "-0.02em",
              display: "block",
            }}
          >
            PreConvara
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontWeight: 400,
              fontSize: size * 0.26,
              color: subColor,
              display: "block",
              marginTop: 1,
            }}
          >
            Prepare. Converse. Win.
          </span>
        </div>
      )}
    </div>
  );
}
