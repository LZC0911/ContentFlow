"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, Edit3 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

/* 内容工作台 —— 三栏布局（左条目 / 中预览编辑 / 右合规+操作）
 * 真实数据：/api/batches/:id + /api/items + /api/items/:id/review
 */
export default function WorkbenchPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [activeBatch, setActiveBatch] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);

  async function refresh() {
    const b = await fetch("/api/batches").then(r => r.json());
    setBatches(b.data);
    if (b.data[0] && !activeBatch) setActiveBatch(b.data[0].id);
  }

  async function loadItems(batchId: string) {
    const b = await fetch(`/api/batches/${batchId}`).then(r => r.json());
    const data = b.data.items || [];
    // 模拟数据库里有数据
    setItems(data.length ? data : MOCK_ITEMS(batchId));
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (activeBatch) loadItems(activeBatch); }, [activeBatch]);

  const filtered = items.filter(i =>
    activeFilter === "all" ? true :
    activeFilter === "pending" ? i.status === "pending" :
    i.status === activeFilter
  );

  async function doReview(id: string, action: "approve" | "reject", reason?: string) {
    const r = await fetch(`/api/items/${id}/review`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    if (!r.ok) { const d = await r.json(); return toast(d.error, "err"); }
    toast(action === "approve" ? "已通过，可分发" : "已驳回", "ok");
    loadItems(activeBatch);
  }

  return (
    <div>
      <header className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-[26px] font-bold">内容工作台</h1>
          <p className="text-[13px] text-ink-mute mt-1">AI 量产，人工把关。只有通过此处的内容才能进入分发。</p>
        </div>
        <Link href="/distribute" className="ml-auto inline-flex items-center gap-[6px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors">
          去分发已通过内容 →
        </Link>
      </header>

      {/* Filter bar */}
      <div className="bg-white border border-surface-border rounded-md px-4 py-3 mb-4 flex items-center gap-3 shadow-soft">
        <div className="text-[12px] font-bold text-ink-mute uppercase tracking-wider">批次</div>
        <select value={activeBatch} onChange={e => setActiveBatch(e.target.value)} className="input w-[240px]">
          {batches.map(b => <option key={b.id} value={b.id}>{b.id} · {b.title}</option>)}
        </select>
        <div className="w-px h-5 bg-surface-border mx-1" />
        {[
          { k: "all",     label: "全部" },
          { k: "pending", label: "待审核" },
          { k: "passed",  label: "已通过" },
          { k: "rejected",label: "已驳回" },
        ].map(f => (
          <button key={f.k} onClick={() => setActiveFilter(f.k)}
            className={`px-3 py-1.5 rounded-md text-[13px] transition-colors ${activeFilter===f.k ? "bg-brand-50 text-brand-600 font-semibold" : "text-ink-sub hover:bg-surface-bg"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3-col layout */}
      <div className="grid grid-cols-[260px_1fr_340px] border border-surface-border rounded-md shadow-soft overflow-hidden bg-white gap-px bg-surface-border">
        {/* Left */}
        <section className="bg-white">
          <div className="px-4 py-2.5 border-b border-surface-border text-[11px] font-bold uppercase tracking-wider text-ink-mute">条目列表</div>
          <div className="max-h-[640px] overflow-y-auto">
            {filtered.length === 0 && <div className="text-center py-10 text-ink-mute text-[13px]">该状态暂无条目</div>}
            {filtered.map((it, i) => {
              const sel = selected?.id === it.id;
              const statusTag =
                it.status === "passed" ? <span className="tag o-green">已通过</span>
                : it.status === "rejected" ? <span className="tag o-red">已驳回</span>
                : <span className="tag o-blue">待审核</span>;
              return (
                <button key={it.id} onClick={() => setSelected(it)}
                  className={`w-full text-left px-3.5 py-3 border-b border-surface-border transition-colors ${sel ? "bg-brand-50 border-l-[3px] border-l-brand-500 pl-2.5" : "hover:bg-surface-bg"}`}
                >
                  <div className="font-semibold text-[13px] leading-snug line-clamp-2">{it.title}</div>
                  <div className="text-[11px] text-ink-mute mt-1 flex items-center gap-2">
                    <span className="tag o-gray">{it.type}</span>
                    {statusTag}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Center */}
        <section className="bg-white min-h-[560px]">
          <div className="px-4 py-2.5 border-b border-surface-border flex items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">内容预览</span>
            <div className="ml-auto flex gap-1.5">
              <button className="btn ghost text-[12px] px-2.5 py-1" onClick={() => toast("已复制到剪贴板")}>复制</button>
              <button className="btn ghost text-[12px] px-2.5 py-1" onClick={() => toast("已保存编辑")}>保存</button>
            </div>
          </div>
          {selected ? (
            <div className="px-5 py-5">
              <input className="input w-full text-[15px] font-bold mb-3" defaultValue={selected.title} />

              {/* Covers */}
              {selected.covers?.length > 0 && (
                <div className="mb-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute mb-2">封面预览</div>
                  <div className="flex gap-3">
                    {selected.covers.map((c: any, i: number) => (
                      <div key={i} className="w-[120px] h-[160px] rounded-md text-white font-bold text-[15px] text-center p-2 flex flex-col items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${c.gradient.split("→")[0]} 0%, rgba(0,0,0,.3) 100%)` }}>
                        <div className="tracking-[3px]">{c.text}</div>
                        {c.sub && <div className="text-[11px] font-medium opacity-90 mt-1">{c.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute mb-2">正文 / 脚本</div>
              <textarea className="textarea w-full min-h-[280px] font-mono text-[13px] leading-[1.8]"
                defaultValue={selected.body} />

              <div className="mt-4 text-[11px] text-ink-mute">
                条目 {selected.id} · 批次 {selected.batchId} · 目标平台 {selected.platforms.join(" / ")}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-ink-mute">
              左侧选择一条内容开始审阅
            </div>
          )}
        </section>

        {/* Right — compliance + actions */}
        <section className="bg-white border-l border-surface-border">
          <div className="px-4 py-2.5 border-b border-surface-border text-[11px] font-bold uppercase tracking-wider text-ink-mute">合规检查</div>
          {selected ? (
            <>
              <div className="px-4 py-4 space-y-2">
                <ComplianceRow label="档案禁用词" hits={selected.compliance?.hardBlock || []} mode="hard" />
                <ComplianceRow label="广告法敏感词" hits={selected.compliance?.warning || []} mode="warn" />
                <ComplianceRow label="平台规范建议" hits={selected.compliance?.info || []} mode="info" />
              </div>

              <div className="border-t border-surface-border px-4 py-3.5 bg-surface-muted">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute mb-2">操作</div>
                <div className="flex flex-col gap-2">
                  <button disabled={selected.compliance?.hardBlock?.length > 0}
                    onClick={() => doReview(selected.id, "approve")}
                    className="btn primary w-full px-4 py-2">
                    <CheckCircle2 className="w-4 h-4" /> 通过并送审
                  </button>
                  <button onClick={() => {
                    const reason = prompt("驳回原因");
                    if (reason) doReview(selected.id, "reject", reason);
                  }} className="btn ghost w-full px-4 py-2 text-danger hover:bg-danger-soft">
                    <XCircle className="w-4 h-4" /> 驳回
                  </button>
                  <button onClick={async () => {
                    const r = await fetch(`/api/items/${selected.id}/regenerate`, { method: "POST" });
                    if (r.ok) { toast("已重新生成 · 扣费 7 额度", "ok"); loadItems(activeBatch); }
                    else { const d = await r.json(); toast(d.error, "err"); }
                  }} className="btn ghost w-full px-4 py-2 text-warning hover:bg-warning-soft">
                    <RefreshCw className="w-4 h-4" /> 重新生成（7 额度）
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-ink-mute text-[12px]">选择条目后显示</div>
          )}
        </section>
      </div>
    </div>
  );
}

function ComplianceRow({ label, hits, mode }: { label: string; hits: string[]; mode: "hard" | "warn" | "info" }) {
  if (!hits.length) {
    const okColor = mode === "hard" ? "success" : mode === "warn" ? "info" : "ink-mute";
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-ink-sub">
        <CheckCircle2 className={`w-3.5 h-3.5 text-${okColor}`} />
        <span>{label}：通过</span>
      </div>
    );
  }
  const icon = mode === "hard" ? XCircle : mode === "warn" ? AlertTriangle : Info;
  const cls = mode === "hard" ? "bg-danger-soft text-danger border-danger"
           : mode === "warn" ? "bg-warning-soft text-warning border-warning"
           : "bg-info-soft text-info border-info";
  return (
    <div className={`rounded-md border p-2.5`} style={{ background: mode==="hard"?"var(--danger-soft)":mode==="warn"?"var(--warning-soft)":"var(--info-soft)", color: mode==="hard"?"var(--danger)":mode==="warn"?"var(--warning)":"var(--info)" }}>
      <div className="flex items-center gap-1.5 font-semibold text-[12px]">
        {(() => {
          const I = icon;
          return <I className="w-3.5 h-3.5" />;
        })()}
        <span>{mode === "hard" ? "硬拦截" : mode === "warn" ? "警告" : "建议"} · {label}</span>
      </div>
      <div className="text-[11.5px] mt-1 space-y-0.5">
        {hits.map((h, i) => <div key={i}>{h}</div>)}
      </div>
    </div>
  );
}

/* 若 store 是空数据库，提供本地 mock 让页面立即可演示 */
function MOCK_ITEMS(batchId: string) {
  return [
    { id: "it-m1", batchId, profileId: "pf02", type: "图文笔记", platforms: ["小红书","抖音"],
      title: "把秋天装进杯子里 · 星野的桂花拿铁来了",
      body: "桂花蜜来自杭州满陇桂雨，每天现熬不超过 4 小时。搭配红豆司康同享 -6 元。",
      covers: [{ gradient:"#D4A373→#774936", text:"秋天", sub:"桂花拿铁" }, { gradient:"#E8B899→#A0603C", text:"满陇桂雨" }],
      compliance: { hardBlock: [], warning: [], info: ["话题标签建议 ≤ 5 个"] }, status: "pending" },
    { id: "it-m2", batchId, profileId: "pf02", type: "短视频脚本", platforms: ["抖音"],
      title: "下班顺路买一杯 · 30s 速看",
      body: "【画面 0-3s 街头跟随】傍晚的街景...【旁白：「每天最期待的 5 分钟」】",
      covers: [{ gradient:"#9C6644→#6F2F18", text:"速看" }],
      compliance: { hardBlock: [], warning: [], info: [] }, status: "pending" },
    { id: "it-m3", batchId, profileId: "pf02", type: "图文笔记", platforms: ["小红书"],
      title: "最好喝的秋天限定（命中禁用词）",
      body: "这杯是最好喝的咖啡，全网第一...",
      covers: [{ gradient:"#B08968→#49352C", text:"限定" }],
      compliance: { hardBlock: ["最好喝"], warning: ["第一"], info: [] }, status: "pending" },
  ];
}
