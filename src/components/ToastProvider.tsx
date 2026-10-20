"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface ToastState { id: number; msg: string; type: "ok" | "err" | "info" | "default"; }
interface Ctx { toast: (msg: string, type?: ToastState["type"]) => void }

const ToastCtx = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ToastState[]>([]);

  const toast = useCallback((msg: string, type: ToastState["type"] = "default") => {
    const id = Date.now() + Math.random();
    setList(l => [...l, { id, msg, type }]);
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
        {list.map(t => (
          <div
            key={t.id}
            className={`animate-toast px-5 py-[10px] rounded-[10px] text-[13.5px] shadow-card text-white ${
              t.type === "ok" ? "bg-success" :
              t.type === "err" ? "bg-danger" :
              t.type === "info" ? "bg-info" : "bg-[#10141e]/92"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
