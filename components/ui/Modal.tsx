"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({ open, onClose, title, children, footer, wide = false }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-start justify-center p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white dark:bg-[#131A21] rounded-2xl shadow-cardLg w-full ${wide ? "max-w-2xl" : "max-w-lg"} p-7 relative animate-fadeUp my-10`}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] flex items-center justify-center"
        >
          ✕
        </button>
        <h3 className="text-lg font-extrabold mb-5 pr-8">{title}</h3>
        <div>{children}</div>
        {footer && <div className="flex justify-end gap-2.5 mt-5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs font-bold text-[var(--gray)] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-2.5 rounded-lg border border-[var(--line)] bg-white dark:bg-[#0B1016] text-sm focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-500/15";
