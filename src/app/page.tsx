"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap, Layers, PenLine, Send, Sparkles, FileText,
  ChartBar, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";

/* 首页 —— 工作台总览
 * 真实数据源：/api/batches + /api/credits
 * 进度条用 setTimeout 驱动，展示"生成中"批次的实时感
 */
export default function DashboardPage() {
  const [batch, setBatch] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);

  useEffect(() => {
    fetch("/api/batches?status=generating").then(r => r.json()).then(d => setBatch(d.data[0] || null));
    fetch("/api/credits").then(r => r.json()).then(d => setCredits(d.data));
  }, []);

  return (
    <div>
      <header className="reveal-r1 mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">你好，陈曦 👋</h1>
        <p className="text-ink-mute text-[13px] mt-1">
          星野咖啡本周跑了 56 条内容，AI 帮你省了约 <b className="text-brand-500">186</b> 小时。
        </p>
      </header>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4 mb-5 reveal-r2">
        {[
          { label: "本月生成条目", val: "56", sub: "↑ 42% vs 上月", icon: Sparkles },
          { label: "审核采纳率",  val: "82%", sub: "↑ 9 个点",    icon: CheckCircle2 },
          { label: "本月已发布",  val: "42", sub: "↑ 56%",       icon: Send },
          { label: "节省工时估算",val: "186h", sub: "≈ 2.5 人周", icon: Clock },
        ].map(k => (
          <div key={k.label} className="bg-white border border-surface-border rounded-md p-5 shadow-soft relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-500 to-brand-300" />
            <div className="text-[11px] font-bold text-ink-mute tracking-wider">{k.label}</div>
            <div className="mt-1 text-[28px] font-extrabold font-mono tracking-tight">{k.val}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-[12px] bg-success-soft text-success px-2 rounded-full font-semibold">{k.sub}</div>
            <div className="absolute right-[14px] top-[14px] w-[34px] h-[34px] rounded-[9px] bg-brand-50 text-brand-500 grid place-items-center">
              <k.icon className="w-[18px] h-[18px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Flow Strip */}
      <div className="bg-white border border-surface-border rounded-md px-5 py-4 mb-5 flex items-center reveal-r3">
        {[
          { n: 1, label: "商品档案",   href: "/profiles" },
          { n: 2, label: "批量生成",   href: "/batches" },
          { n: 3, label: "审核把关",   href: "/workbench" },
          { n: 4, label: "一键分发",   href: "/distribute" },
          { n: 5, label: "核对费用",   href: "/billing" },
        ].map((s, i, arr) => (
          <div key={s.n} className="flex-1 flex flex-col items-center text-center">
            <Link href={s.href} className="w-8 h-8 rounded-full bg-surface-bg border border-surface-border text-ink-mute grid place-items-center font-bold font-mono text-[13px] hover:bg-brand-50 hover:text-brand-500 hover:border-brand-500 transition-colors">
              {s.n}
            </Link>
            <div className="font-semibold text-[13.5px] mt-2">{s.label}</div>
            {i < arr.length - 1 && <span className="hidden" />}
          </div>
        ))}
      </div>

      {/* Running + Credits */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        {/* Running batch */}
        <div className="bg-white border border-surface-border rounded-md p-5 reveal-r4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold">进行中批次</h3>
            {batch && <span className="tag o-blue">生成中</span>}
          </div>
          {batch ? (
            <div>
              <div className="text-[12px] font-mono text-ink-mute">{batch.id}</div>
              <div className="font-semibold text-[15px] mt-1">{batch.title}</div>
              <div className="text-[12.5px] text-ink-mute mt-1">档案：{batch.profileName}</div>
              <div className="mt-4 h-1.5 bg-[#E9EDF4] rounded-full overflow-hidden">
                <BatchProgress total={batch.progress.total} success={batch.progress.success} />
              </div>
              <div className="mt-2 text-[12px] text-ink-sub flex justify-between">
                <span>成功 {batch.progress.success} · 失败 {batch.progress.failed}</span>
                <span className="font-mono">{Math.round(batch.progress.success / batch.progress.total * 100)}%</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href="/batches" className="btn ghost text-[13px] px-4 py-2" style={{display:"inline-flex",alignItems:"center",gap:"6px"}}>
                  <Layers className="w-4 h-4" /> 查看批次
                </Link>
                <Link href="/workbench" className="btn ghost text-[13px] px-4 py-2" style={{display:"inline-flex",alignItems:"center",gap:"6px"}}>
                  <PenLine className="w-4 h-4" /> 去审阅
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-ink-mute">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <div className="font-semibold text-ink-sub">当前没有生成中的批次</div>
              <div className="text-[12px] mt-1">新建一个试试？</div>
            </div>
          )}
        </div>

        {/* Credits overview */}
        <div className="bg-white border border-surface-border rounded-md p-5 reveal-r5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold">额度概览</h3>
            <span className="tag o-blue">专业版</span>
          </div>
          {credits && (
            <>
              <div className="text-[28px] font-extrabold font-mono text-brand-500">
                {credits.available.toLocaleString()}
                <span className="text-[13px] font-medium text-ink-sub ml-1">可用额度</span>
              </div>
              <div className="text-[12.5px] text-ink-sub mt-1 mb-4">
                月度 {credits.monthlyTotal.toLocaleString()} · 已用 {(credits.monthlyTotal - credits.available - credits.frozen - credits.addon).toLocaleString()} · 冻结 {credits.frozen} · 加购 {credits.addon}
              </div>
              <div className="h-1.5 bg-[#E9EDF4] rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${((credits.monthlyTotal - (credits.available - credits.addon)) / credits.monthlyTotal) * 100}%` }} />
              </div>
              <Link href="/billing" className="mt-4 inline-flex items-center gap-[6px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors">
                <Zap className="w-4 h-4" /> 加购额度
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Usage trend */}
      <div className="mt-4 bg-white border border-surface-border rounded-md p-5 reveal-r6">
        <h3 className="font-bold mb-4">近 5 个月额度消耗趋势</h3>
        <div className="flex items-end gap-[18px] h-[140px]">
          {[
            { m: "6月", v: 1240 }, { m: "7月", v: 1680 },
            { m: "8月", v: 2040 }, { m: "9月", v: 2560 },
            { m: "10月", v: 1760 },
          ].map((d, i) => {
            const h = Math.round(d.v / 2560 * 135);
            return (
              <div key={d.m} className="flex-1 flex flex-col items-center gap-1">
                <div className={`font-mono text-[11px] ${i === 4 ? "text-brand-500 font-bold" : "text-ink-sub"}`}>{d.v.toLocaleString()}</div>
                <div className={`w-7 rounded-t-md transition-all duration-500`} style={{ height: `${h}px`, background: i === 4 ? "linear-gradient(180deg,var(--brand-500),var(--brand-600))" : "linear-gradient(180deg,#6B8AFF,var(--brand-500))" }} />
                <div className="text-[11px] text-ink-mute">{d.m}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* 批次进度模拟 —— setTimeout 驱动，展示"实时"跳动 */
function BatchProgress({ total, success }: { total: number; success: number }) {
  const [cur, setCur] = useState(success);
  useEffect(() => {
    if (cur >= total) return;
    const t = setTimeout(() => setCur(c => Math.min(c + 1, total)), 1500 + Math.random() * 1500);
    return () => clearTimeout(t);
  }, [cur, total]);
  return (
    <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${(cur / total) * 100}%` }} />
  );
}
