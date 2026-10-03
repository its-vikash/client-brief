"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import AiChatWidget from "@/components/AiChatWidget";
import PreConvaraLogo from "@/components/PreConvaraLogo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<null | boolean>(null);
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getSupabaseUser().then((u) => {
      if (!u) {
        router.replace("/");
        setAuthState(false);
      } else {
        setUser(getCurrentUser());
        setAuthState(true);
      }
    });

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          router.replace("/");
          setAuthState(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [router]);

  if (authState !== true) {
    return <div className="h-screen w-screen" style={{ background: "var(--bg-canvas)" }} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar — only visible on md and below */}
        <header
          className="md:hidden flex items-center justify-between px-4 h-14 shrink-0 border-b z-40"
          style={{
            backgroundColor: "var(--bg-sidebar)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <PreConvaraLogo size={28} light markOnly />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-cream)" }}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-canvas)" }}>
          {children}
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <MobileSidebar
          user={user}
          onClose={() => setMobileOpen(false)}
        />
      )}

      {/* AI Chat widget */}
      <AiChatWidget />
    </div>
  );
}
