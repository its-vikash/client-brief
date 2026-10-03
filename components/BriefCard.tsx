import clsx from "clsx";

// ── Accent palette matching the screenshot ────────────────────────────────────
// orange  → summary / overview card
// teal    → questions card
// yellow  → watchouts / concerns card
// dark    → next steps card
// cream   → default / neutral
// green   → positive / opportunities

type Accent = "cream" | "orange" | "teal" | "yellow" | "dark" | "green" | "red";

interface BriefCardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  accent?: Accent;
  count?: number;
}

const styles: Record<Accent, { wrapper: string; title: string; dot?: string }> = {
  cream: {
    wrapper: "bg-[#F5F1EA] border border-[#E0DAD1]",
    title: "text-[#4A5E5B]",
  },
  orange: {
    wrapper: "bg-[#E8652A]",
    title: "text-white",
  },
  teal: {
    wrapper: "bg-[#7CBFB5]",
    title: "text-[#1C2B2D]",
  },
  yellow: {
    wrapper: "bg-[#F0DC8C]",
    title: "text-[#4A3B00]",
  },
  dark: {
    wrapper: "bg-[#1C2B2D]",
    title: "text-white",
  },
  green: {
    wrapper: "bg-[#B8DDD6]",
    title: "text-[#1C2B2D]",
  },
  red: {
    wrapper: "bg-[#F5C4B0]",
    title: "text-[#7A2800]",
  },
};

export default function BriefCard({
  title,
  icon,
  children,
  className,
  accent = "cream",
  count,
}: BriefCardProps) {
  const s = styles[accent];
  return (
    <div className={clsx("rounded-2xl p-5 sm:p-6", s.wrapper, className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className={clsx("opacity-70", s.title)}>{icon}</span>}
          <h3
            className={clsx(
              "text-[10px] font-bold uppercase tracking-widest",
              s.title
            )}
          >
            {title}
          </h3>
        </div>
        {count !== undefined && (
          <span
            className={clsx(
              "text-xs font-semibold opacity-50",
              s.title
            )}
          >
            {String(count).padStart(2, "0")}
          </span>
        )}
      </div>
      <div
        className={clsx(
          "text-sm leading-relaxed",
          accent === "orange" || accent === "dark"
            ? "text-white/90"
            : "text-[#1C2B2D]/80"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function BriefList({
  items,
  light = false,
}: {
  items: string[];
  light?: boolean;
}) {
  if (!items?.length)
    return (
      <p className={light ? "text-white/40 italic" : "text-[#7A928F] italic"}>
        None provided.
      </p>
    );
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 items-start">
          <span
            className={clsx(
              "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
              light ? "bg-white/50" : "bg-[#1C2B2D]/30"
            )}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
