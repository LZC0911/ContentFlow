"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles, LayoutDashboard, Package, Layers, PenLine,
  Send, Image, CreditCard, Users, Bell, Plus, Zap,
} from "lucide-react";

/** 导航项 —— 与原型 contract 严格对齐（冻结） */
const NAV = [
  { label: "工作台总览", icon: LayoutDashboard, href: "/",          group: "核心流程" },
  { label: "商品档案",   icon: Package,          href: "/profiles", group: "核心流程" },
  { label: "生成批次",   icon: Layers,           href: "/batches",  group: "核心流程" },
  { label: "内容工作台", icon: PenLine,          href: "/workbench", group: "核心流程" },
  { label: "一键分发",   icon: Send,             href: "/distribute", group: "核心流程" },
  { label: "素材库",     icon: Image,            href: "/assets",   group: "资源" },
  { label: "费用与订阅", icon: CreditCard,       href: "/billing",  group: "资源" },
  { label: "团队与账号", icon: Users,            href: "/team",     group: "资源" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[232px]">
        <Topbar />
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar() {
  const pathname = usePathname();
  const grouped = NAV.reduce<Record<string, typeof NAV>>((acc, n) => {
    (acc[n.group] ||= []).push(n); return acc;
  }, {});

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[232px] bg-white border-r border-surface-border flex flex-col z-30">
      <Link href="/" className="p-[18px_20px_16px] border-b border-surface-border flex items-center gap-[10px]">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-400 grid place-items-center text-white shadow-[0_4px_10px_rgba(43,78,255,0.28)]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-[16px] tracking-tight">ContentFlow</div>
          <div className="text-[11px] text-ink-mute font-mono">v0.1 · MVP</div>
        </div>
      </Link>

      <nav className="flex-1 px-[10px] py-[10px] overflow-y-auto">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <div className="px-[14px] pt-[18px] pb-[6px] text-[11px] font-bold text-ink-mute uppercase tracking-[1px]">{group}</div>
            {items.map(n => {
              const active = n.href === pathname || (n.href !== "/" && pathname.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative flex items-center gap-[11px] px-[14px] py-[9px] rounded-[8px] text-[13.5px] font-medium mb-[2px] transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-600 font-semibold"
                      : "text-ink-sub hover:bg-surface-bg hover:text-ink"
                  }`}
                >
                  {active && <span className="absolute left-[-10px] top-[7px] bottom-[7px] w-[3px] bg-brand-500 rounded-[2px]" />}
                  <n.icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-[14px] py-[14px] border-t border-surface-border">
        <div className="bg-surface-bg rounded-[10px] px-[12px] py-[10px] flex items-center gap-[10px]">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#C47849] to-[#8B4513] text-white grid place-items-center font-bold text-[14px]">星</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px] truncate">星野咖啡（上海）</div>
            <div className="text-[11.5px] text-ink-mute">专业版 · 12 月到期</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Topbar ---------- */
function Topbar() {
  const pathname = usePathname();
  const [credits, setCredits] = useState<{ available: number; frozen: number } | null>(null);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => setCredits({ available: d.data.available, frozen: d.data.frozen }));
  }, [pathname]);

  const current = NAV.find(n => n.href === pathname || (n.href !== "/" && pathname.startsWith(n.href)));

  return (
    <header className="sticky top-0 h-[56px] bg-white/90 backdrop-blur border-b border-surface-border flex items-center px-6 gap-4 z-20">
      <div className="text-[17px] font-bold">{current?.label || "ContentFlow"}</div>
      {credits && (
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-brand-50 text-brand-600 rounded-full px-3 py-[5px] font-semibold text-[12.5px] font-mono">
            <Zap className="w-4 h-4" />
            <span>可用 <b>{credits.available.toLocaleString()}</b></span>
            {credits.frozen > 0 && <span className="text-warning ml-1">冻结 {credits.frozen}</span>}
          </div>
          <Link href="/batches" className="inline-flex items-center gap-[6px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors shadow-[0_2px_6px_rgba(43,78,255,0.28)]">
            <Plus className="w-[15px] h-[15px]" /> 新建批次
          </Link>
          <button className="w-9 h-9 rounded-[8px] grid place-items-center text-ink-sub hover:bg-surface-bg hover:text-ink relative">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-[9px] right-[9px] w-2 h-2 bg-danger rounded-full" />
          </button>
        </div>
      )}
    </header>
  );
}
