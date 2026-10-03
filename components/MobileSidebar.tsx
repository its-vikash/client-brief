"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Plus, LogOut, Globe, HelpCircle,
  CalendarClock, X, Wand2, FileText, MessageSquare, Layers,
} from "lucide-react";
import { logout, getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import PreConvaraLogo from "@/components/PreConvaraLogo";
import clsx from "clsx";

interface MobileSidebarProps {
  user: AuthUser | null;
  onClose: () => void;
}

export default function MobileSidebar({ user, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleLogout() {
    logout();
    onClose();
    router.push("/");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    // /dashboard/create must not match /dashboard/create-doc
    if (href === "/dashboard/create") return pathname === "/dashboard/create" || pathname === "/dashboard/create/";
    return pathname.startsWith(href);
  }

  // ── Must stay in sync with components/Sidebar.tsx navItems ────────────────
  const primaryNav = [
    { href: "/dashboard",                       label: "Overview",    icon: LayoutDashboard },
    { href: "/dashboard/create",                label: "New brief",   icon: Plus, isAction: true },
    { href: "/dashboard/create-doc",            label: "AI Create",   icon: Wand2 },
    { href: "/dashboard/transcripts",           label: "Transcripts", icon: FileText },
    { href: "/dashboard/ask",                   label: "Ask AI",      icon: MessageSquare },
    { href: "/dashboard/schedule",              label: "Schedule",    icon: CalendarClock },
    { href: "/dashboard/integrations/gmail",    label: "Gmail",       icon: Layers },
    { href: "/dashboard/integrations/slack",    label: "Slack",       icon: Layers },
  ];

  const secondaryNav = [
    { href: "/dashboard/faq", label: "FAQ & Help", icon: HelpCircle },
    { href: "/",              label: "About",       icon: Globe },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex anim-fade-in"
      style={{ backgroundColor: "rgba(28,43,45,0.55)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        className="relative h-full flex flex-col w-72 max-w-[85vw] anim-slide-in-left"
        style={{ backgroundColor: "var(--bg-sidebar)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
          <PreConvaraLogo size={30} light />
          <button onClick={onClose}
            className="p-2 rounded-xl opacity-40 hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-cream)" }} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-0.5 pb-2">
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.22)" }}>
            Workspace
          </p>

          {primaryNav.map(({ href, label, icon: Icon, isAction }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  active ? "bg-white/10" : "hover:bg-white/5"
                )}
                style={{ color: active ? "var(--text-cream)" : "rgba(255,255,255,0.5)" }}
              >
                <Icon className="w-4 h-4 shrink-0"
                  style={{ color: active && isAction ? "var(--orange)" : undefined }} />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--orange)" }} />
                )}
              </Link>
            );
          })}

          <div className="my-2 h-px mx-2" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />

          {secondaryNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User row */}
        <div className="border-t px-4 py-4 shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: "var(--teal)", color: "var(--text-cream)" }}>
                {user.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-cream)" }}>{user.name}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{user.email}</p>
                <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.25)" }}>{user.role}</p>
              </div>
              <button onClick={handleLogout} title="Sign out"
                className="shrink-0 p-1.5 rounded-lg opacity-30 hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-cream)" }}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" onClick={onClose}
              className="block text-sm font-semibold text-center py-2 rounded-xl transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--orange)", color: "#fff" }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
