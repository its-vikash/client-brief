import Link from "next/link";
import PreConvaraLogo from "@/components/PreConvaraLogo";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-canvas)" }}
    >
      {/* Background blobs */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full pointer-events-none"
        style={{ backgroundColor: "var(--orange)", opacity: 0.08, filter: "blur(80px)" }} />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 rounded-full pointer-events-none"
        style={{ backgroundColor: "var(--teal)", opacity: 0.08, filter: "blur(100px)" }} />

      <div className="relative text-center max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/"><PreConvaraLogo size={36} /></Link>
        </div>

        {/* Big 404 */}
        <div className="mb-6">
          <p
            className="font-extrabold leading-none select-none"
            style={{
              fontFamily: "var(--font-bricolage), sans-serif",
              fontSize: "clamp(6rem, 20vw, 12rem)",
              color: "var(--border)",
              letterSpacing: "-0.05em",
            }}
          >
            404
          </p>
        </div>

        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-3"
          style={{ fontFamily: "var(--font-bricolage), sans-serif", color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p
          className="text-sm leading-relaxed mb-8 max-w-sm mx-auto"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: "var(--orange)", color: "#fff" }}
          >
            ← Back to home
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
            style={{
              backgroundColor: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Go to dashboard
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
          style={{ color: "var(--text-muted)" }}>
          {[
            { label: "Help Center", href: "/help" },
            { label: "FAQ",         href: "/faq" },
            { label: "Contact",     href: "/contact" },
          ].map(({ label, href }) => (
            <Link key={label} href={href}
              className="hover:underline hover:opacity-80 transition-opacity">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
