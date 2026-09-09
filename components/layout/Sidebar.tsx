"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/students", label: "Élèves", icon: "🧑🏾‍🎓" },
  { href: "/admin/modules", label: "Modules", icon: "📚" },
  { href: "/admin/library", label: "Bibliothèque média", icon: "🗂️" },
  { href: "/admin/quizzes", label: "Quiz", icon: "📝" },
  { href: "/admin/announcements", label: "Annonces", icon: "📢" },
  { href: "/admin/resources", label: "Ressources", icon: "📁" },
  { href: "/admin/stats", label: "Statistiques", icon: "📊" },
  { href: "/admin/settings", label: "Paramètres", icon: "⚙️" },
];

const STUDENT_LINKS = [
  { href: "/student", label: "Tableau de bord", icon: "🏠" },
  { href: "/student/modules", label: "Mes modules", icon: "📚" },
  { href: "/student/certificate", label: "Mon certificat", icon: "🏆" },
  { href: "/student/profile", label: "Mon profil", icon: "👤" },
];

export function Sidebar({ role, open, onClose }: { role: "admin" | "student"; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "admin" ? ADMIN_LINKS : STUDENT_LINKS;

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={clsx(
      "w-[250px] flex-shrink-0 bg-[var(--ink)] text-white flex flex-col fixed lg:sticky top-0 h-screen overflow-y-auto z-50 transition-[left]",
      open ? "left-0" : "-left-[270px] lg:left-0"
    )}>
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center font-extrabold text-sm flex-shrink-0">EA</div>
        <div className="font-extrabold text-sm leading-tight">
          ECOM ACADÉMIE<span className="block text-[10px] font-semibold text-white/50">PRO {role === "admin" ? "· Admin" : ""}</span>
        </div>
      </div>
      <nav className="p-2.5 flex-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold mb-0.5 transition-colors",
                active ? "bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white shadow-[inset_3px_0_0_var(--teal)]" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="w-4.5 text-center">{l.icon}</span> {l.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold mb-0.5 text-white/70 hover:bg-white/5 hover:text-white w-full text-left"
        >
          <span className="w-4.5 text-center">🚪</span> Déconnexion
        </button>
      </nav>
      <div className="px-4 py-4 border-t border-white/10 text-[10px] text-white/35">
        Ecom Académie Pro
      </div>
    </aside>
  );
}
