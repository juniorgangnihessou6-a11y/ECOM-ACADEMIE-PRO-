"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "default" | "ghost" | "danger";
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center gap-2 rounded-xl font-semibold transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed",
          size === "md" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
          variant === "primary" && "brand-gradient text-white shadow-md hover:opacity-90",
          variant === "default" && "border border-[var(--line)] bg-white dark:bg-[#131A21] text-[var(--ink)] hover:border-[var(--blue)] hover:text-[var(--blue)]",
          variant === "ghost" && "text-[var(--gray)] hover:bg-[var(--bg-soft)]",
          variant === "danger" && "text-red-600 border border-transparent hover:border-red-300 hover:bg-red-50",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
