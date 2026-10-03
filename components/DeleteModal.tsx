"use client";

import { useEffect } from "react";
import { Trash2, X } from "lucide-react";

interface DeleteModalProps {
  companyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({
  companyName,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 anim-fade-in"
      style={{ backgroundColor: "rgba(28,43,45,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-7 anim-scale-in"
        style={{ backgroundColor: "var(--bg-card-alt)", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-opacity opacity-30 hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          <Trash2 className="w-5 h-5" style={{ color: "#DC2626" }} />
        </div>

        {/* Copy */}
        <h2
          className="text-lg font-extrabold mb-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-bricolage), sans-serif" }}
        >
          Delete this brief?
        </h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {companyName}
          </span>{" "}
          will be permanently removed. This can't be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#DC2626" }}
          >
            Delete brief
          </button>
        </div>
      </div>
    </div>
  );
}
