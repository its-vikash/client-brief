"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // three states: "checking" | "redirect" | "show"
  const [state, setState] = useState<"checking" | "redirect" | "show">("checking");

  useEffect(() => {
    if (getCurrentUser()) {
      // Already logged in — go to dashboard, never show the form
      router.replace("/dashboard");
      setState("redirect");
    } else {
      setState("show");
    }
  }, [router]);

  // Show nothing while checking (prevents flash of form content for logged-in users)
  if (state !== "show") {
    return (
      <div
        className="min-h-screen"
        style={{ background: "var(--bg-canvas)" }}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-canvas)" }}
    >
      {children}
    </div>
  );
}
