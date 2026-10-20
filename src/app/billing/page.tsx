"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Download, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function BillingPage() {
  const { toast } = useToast();
  const [credits, setCredits] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => setCredits(d.data));
    fetch("/api/bills").then(r => r.json()).then(d => setBills(d.data));
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[26px] font-bold">费用与订阅</h1>
        <p className="text-[13px] text-ink-mute mt-1">订阅档位 + 额度钱包 + 明细核对。费用透明：先预估、后扣减、可核对。</p>
      </header>

      {/* Plans */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { name: "免费体验版", price: "0",  unit: "/ 一次性", credits: "体验额度 50", seats: "1 席位", highlights: ["AI 生成与审阅", "可导出内容不可分发"], featured: false },
          { name: "专业版",     price: "299", unit: "¥ / 月",  credits: "月度额度 3,000", seats: "5 席位", highlights: ["全平台分发", "加购额度可叠加", "数据导出 + 审计日志"], featured: true, current: true },
          { name: "团队版",     price: "899", unit: "¥ / 月",  credits: "月度额度 12,000", seats: "20 席位", highlights: ["批次 API 对接", "专属客户成功", "超大体量供给"], featured: false },
        ].map(p => (
          <div key={p.name} className={`bg-white border rounded-lg p-5 shadow-soft relative ${p.featured ? "border-brand-500 shadow-[0_0_0_3px_var(--brand-50)]" : "border-surface-border"}`}>
            {p.featured && <span className="absolute -top-2.5 right-4 bg-brand-500 text-white text-[11px] font-bold px-2.5 py-[3px] rounded-full">当前方案</span>}
            <h4 className="font-bold text-[15px]">{p.name}</h4>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-[34px] font-extrabold font-mono text-brand-500 tracking-tight">{p.price}</span>
              <span className="text-[13px] text-ink-mute">{p.unit}</span>
            </div>
            <div className="text-[12.5px] text-ink-sub mt-0.5 mb-3">{p.credits} · {p.seats}</div>
            <ul className="text-[13px] text-[#42506b] space-y-1.5 mb-4">
              {p.highlights.map(h => (
                <li key={h} className="flex items-start gap-2">
                  <CheckCircle2 className="w-[14px] h-[14px] text-success shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            {p.current ? (
              <button disabled className="btn ghost w-full opacity-60">当前订阅中</button>
            ) : p.featured ? (
              <button className="btn primary w-full" onClick={() => toast("跳转 Stripe Checkout（占位）", "info")}>升级立即生效</button>
            ) : (
              <button className="btn ghost w-full" onClick={() => toast("跳转 Stripe Checkout（占位）", "info")}>升级</button>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4 mb-6">
        {/* Credits overview */}
        <div className="bg-white border border-surface-border rounded-md p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold">额度概览</h3>
            <span className="tag o-blue">专业版</span>
          </div>
          {credits && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-[11px] text-ink-mute font-bold mb-1">月度订阅额度</div>
                  <div className="font-mono text-[28px] font-extrabold text-brand-500">{credits.monthlyTotal.toLocaleString()}</div>
                  <div className="text-[12px] text-ink-sub mt-0.5">已用 {(credits.monthlyTotal - credits.addon).toLocaleString()}</div>
                  <div className="h-1.5 bg-[#E9EDF4] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(credits.monthlyUsed / credits.monthlyTotal) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-ink-mute font-bold mb-1">加购额度</div>
                  <div className="font-mono text-[28px] font-extrabold text-success">{credits.addon.toLocaleString()}</div>
                  <div className="text-[12px] text-ink-sub mt-0.5">不过期</div>
                </div>
                <div>
                  <div className="text-[11px] text-ink-mute font-bold mb-1">当前冻结</div>
                  <div className="font-mono text-[28px] font-extrabold text-warning">{credits.frozen.toLocaleString()}</div>
                  <div className="text-[12px] text-ink-sub mt-0.5">生成中批次</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 items-end mt-4">
                {[1240, 1680, 2040, 2560, credits.monthlyUsed].map((v, i) => {
                  const h = Math.round(v / 2560 * 90);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`font-mono text-[10.5px] ${i===4?"text-brand-500 font-bold":"text-ink-sub"}`}>{v}</div>
                      <div className="w-[22px] rounded-t-md transition-all duration-500" style={{ height: `${h}px`, background: i===4 ? "linear-gradient(180deg,var(--brand-500),var(--brand-600))" : "linear-gradient(180deg,#6B8AFF,var(--brand-500))" }} />
                      <div className="text-[10px] text-ink-mute">{["6月","7月","8月","9月","10月"][i]}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Add-ons */}
        <div className="bg-white border border-surface-border rounded-md p-5 shadow-soft">
          <h3 className="font-bold mb-1">加购额度包</h3>
          <p className="text-[12.5px] text-ink-mute mb-4">加购额度不过期，月度用完自动续上。</p>
          <div className="space-y-2">
            {[
              { price: 30,  credits: 500 },
              { price: 100, credits: 2000, recommended: true },
              { price: 280, credits: 6000 },
            ].map(p => (
              <div key={p.price} className={`rounded-md border p-3 flex items-center gap-3 ${p.recommended ? "border-brand-500 bg-brand-xxs-50" : "border-surface-border"}`}>
                <div className="flex-1">
                  <div className="font-bold text-[15px]">¥{p.price} <span className="text-[11px] text-success font-semibold">{p.recommended?"省 ¥20":""}</span></div>
                  <div className="text-[12px] text-ink-sub">+ {p.credits.toLocaleString()} 额度</div>
                </div>
                <button className="btn primary text-[13px]" onClick={() => toast("跳转 Stripe Checkout（占位）", "info")}>立即购买</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bills */}
      <div className="bg-white border border-surface-border rounded-md shadow-soft overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
          <h3 className="font-bold text-[14px]">费用明细</h3>
          <span className="tag o-blue">近 30 天</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => toast("已导出 CSV（示意）")} className="btn ghost text-[12px] px-3 py-1.5 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> 导出 CSV
            </button>
          </div>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-surface-muted border-b border-surface-border text-[12px] text-ink-sub font-semibold uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 w-[160px]">时间</th>
              <th className="text-left px-4 py-2.5 w-20">操作者</th>
              <th className="text-left px-4 py-2.5 w-20">类型</th>
              <th className="text-left px-4 py-2.5">详情</th>
              <th className="text-left px-4 py-2.5 w-20">费用</th>
              <th className="text-left px-4 py-2.5 w-24">额度钱包</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-ink-mute">暂无费用流水</td></tr>}
            {bills.map(b => (
              <tr key={b.id} className="border-b border-surface-border hover:bg-brand-xxs-100">
                <td className="px-4 py-2.5 font-mono text-[12px] text-ink-sub">{b.time.replace("T", " ").slice(0, 16)}</td>
                <td className="px-4 py-2.5">{b.actor}</td>
                <td className="px-4 py-2.5">
                  <span className={`tag ${b.type === "生成" ? "o-blue" : b.type === "分发" ? "o-orange" : b.type === "退还" ? "o-green" : "o-slate"}`}>{b.type}</span>
                </td>
                <td className="px-4 py-2.5 text-[#42506b]">{b.detail}</td>
                <td className={`px-4 py-2.5 font-mono font-bold ${b.cost > 0 ? "text-success" : "text-danger"}`}>
                  {b.cost > 0 ? "+" : ""}{b.cost}
                </td>
                <td className="px-4 py-2.5 text-[12.5px] text-ink-sub">{b.wallet === "monthly" ? "月度" : "加购"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
