"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-lg tracking-tight">
            PreConvara
          </span>
        </Link>

        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          New Brief
        </Link>
      </div>
    </header>
  );
}
