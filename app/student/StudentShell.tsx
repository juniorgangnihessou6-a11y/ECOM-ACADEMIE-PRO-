"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Profile } from "@/lib/types";

export function StudentShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="student" open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar profile={profile} onMenuClick={() => setMenuOpen(true)} />
        <div className="flex-1 max-w-5xl w-full mx-auto p-6">{children}</div>
      </div>
    </div>
  );
}
