"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Profile } from "@/lib/types";

export function AdminShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar profile={profile} onMenuClick={() => setMenuOpen(true)} showSearch />
        <div className="flex-1 max-w-6xl w-full mx-auto p-6">{children}</div>
      </div>
    </div>
  );
}
