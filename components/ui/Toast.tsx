"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ToastItem { id: number; message: string; }
const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2">
            {toasts.map((t) => (
              <div key={t.id} className="bg-[var(--ink)] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-cardLg animate-fadeUp">
                {t.message}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
