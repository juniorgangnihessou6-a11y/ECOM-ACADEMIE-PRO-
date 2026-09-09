import clsx from "clsx";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "bg-white dark:bg-[#131A21] border border-[var(--line)] rounded-2xl p-5 shadow-card animate-fadeUp",
        className
      )}
      {...props}
    />
  );
}

export function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <Card className="p-5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-2.5"
        style={{ background: "linear-gradient(135deg, rgba(15,207,164,0.16), rgba(30,99,233,0.16))" }}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-[var(--gray)] font-semibold mt-0.5">{label}</div>
    </Card>
  );
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "green" | "red" | "blue" | "gray" | "orange" }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
    gray: "bg-[var(--bg-soft)] text-[var(--gray)]",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold", tones[tone])}>
      {children}
    </span>
  );
}

export function ProgressBar({ pct, sm = false }: { pct: number; sm?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={clsx("bg-[var(--line)] rounded-full overflow-hidden", sm ? "h-1.5" : "h-2.5")}>
      <div
        className="h-full rounded-full brand-gradient transition-all duration-500"
        style={{ width: clamped + "%" }}
      />
    </div>
  );
}
