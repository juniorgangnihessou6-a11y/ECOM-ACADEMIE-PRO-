"use client";

import { useState } from "react";
import { Profile } from "@/lib/types";
import { initials } from "@/lib/utils";

export function Topbar({ profile, onMenuClick, showSearch = false }: {
  profile: Profile | null;
  onMenuClick: () => void;
  showSearch?: boolean;
}) {
  const [query, setQuery] = useState("");

  return (
    <div className="flex items-center justify-between gap-3.5 px-6 py-3.5 bg-white dark:bg-[#131A21] border-b border-[var(--line)] sticky top-0 z-40 print:hidden">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-lg border border-[var(--line)] flex items-center justify-center">☰</button>
        {showSearch && (
          <div className="relative max-w-xs flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--gray)]">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher élèves, modules, vidéos…"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--bg-soft)] border border-[var(--line)] text-sm focus:outline-none focus:border-[var(--blue)]"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[var(--bg-soft)] border border-[var(--line)]">
          <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center text-white text-[11px] font-extrabold">
            {initials(profile?.prenom, profile?.nom)}
          </div>
          <span className="text-xs font-bold hidden sm:inline">{profile?.prenom || "…"}</span>
        </div>
      </div>
    </div>
  );
}
