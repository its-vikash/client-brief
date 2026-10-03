"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Plus, LogOut, Globe, HelpCircle, CalendarClock, Wand2, FileText, MessageSquare, Layers } from "lucide-react";
import { logout, getCurrentUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";
import clsx from "clsx";
import PreConvaraLogo from "@/components/PreConvaraLogo";

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  // ── Primary nav ──────────────────────────────────────────────────────────
  const navItems = [
    { href: "/dashboard",                label: "Overview",    icon: LayoutDashboard },
    { href: "/dashboard/create",         label: "New brief",   icon: Plus, isAction: true },
    { href: "/dashboard/create-doc",     label: "AI Create",   icon: Wand2 },
    { href: "/dashboard/transcripts",    label: "Transcripts", icon: FileText },
    { href: "/dashboard/ask",            label: "Ask AI",      icon: MessageSquare },
    { href: "/dashboard/schedule",       label: "Schedule",    icon: CalendarClock },
    { href: "/dashboard/integrations/gmail",  label: "Gmail", icon: Layers },
    { href: "/dashboard/integrations/slack",  label: "Slack", icon: Layers },
  ];

  // ── Secondary / bottom links ─────────────────────────────────────────────
  const bottomLinks = [
    { href: "/dashboard/faq", label: "FAQ & Help",   icon: HelpCircle },
    { href: "/",              label: "About",         icon: Globe },
  ];

  function isActive(href: string) {
    // /dashboard is exact-match only
    if (href === "/dashboard") return pathname === "/dashboard";
    // /dashboard/create must NOT match /dashboard/create-doc etc — use exact match
    if (href === "/dashboard/create") return pathname === "/dashboard/create" || pathname === "/dashboard/create/";
    // All other routes: startsWith is fine (e.g. /dashboard/brief/[id])
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="hidden shrink-0 md:flex flex-col w-[210px]"
      style={{ backgroundColor: "var(--bg-sidebar)", height: "100vh", position: "sticky", top: 0 }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard">
          <PreConvaraLogo size={32} light />
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p
          className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          Workspace
        </p>

        {navItems.map(({ href, label, icon: Icon, isAction }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                active ? "bg-white/10" : "hover:bg-white/5"
              )}
              style={{ color: active ? "var(--text-cream)" : "rgba(255,255,255,0.45)" }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: active && isAction ? "var(--orange)" : undefined }}
              />
              {label}
              {active && (
                <span
                  className="ml-auto w-1.5 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--orange)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Ritual blurb */}
      <div
        className="mx-3 mb-2 rounded-2xl px-4 py-3.5"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        <p className="label-eyebrow mb-1.5" style={{ color: "var(--orange)", opacity: 0.7 }}>
          The Ritual
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>
          A little preparation makes space for better conversations.
        </p>
      </div>

      {/* Bottom / secondary links */}
      <div className="px-3 pb-2 space-y-0.5">
        {bottomLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                active ? "bg-white/10 text-white/80" : "hover:bg-white/5"
              )}
              style={{ color: active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)" }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* User row */}
      <div
        className="px-4 pb-5 pt-3 border-t flex items-center gap-3"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: "var(--teal)", color: "var(--text-cream)" }}
        >
          {user?.initials ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: "var(--text-cream)" }}>
            {user?.name ?? "Guest"}
          </p>
          <p
            className="text-[10px] truncate leading-tight mt-0.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {user?.role ?? ""}
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="shrink-0 p-1 rounded-lg transition-all opacity-30 hover:opacity-80"
          style={{ color: "var(--text-cream)" }}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
