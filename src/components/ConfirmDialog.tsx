"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmContextValue {
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: () => Promise.resolve(false) });

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ message: string; title: string; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((message: string, title = "Confirmation") => {
    return new Promise<boolean>((resolve) => {
      setState({ message, title, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        state.resolve(false);
        setState(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40"
          onClick={handleCancel}
          onKeyDown={(e) => { if (e.key === "Escape") handleCancel(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div className="bg-white rounded-xl border border-bdr shadow-2xl p-6 max-w-sm w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 id="confirm-title" className="text-sm font-bold text-navy">{state.title}</h3>
            </div>
            <p id="confirm-message" className="text-xs text-txt2 mb-6 pl-[52px]">{state.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={handleCancel} className="px-4 py-2 text-xs font-semibold text-txt2 bg-white border border-bdr rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Annuler
              </button>
              <button onClick={handleConfirm} className="px-4 py-2 text-xs font-semibold text-white bg-navy rounded-lg hover:bg-navy-l transition-colors cursor-pointer">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
