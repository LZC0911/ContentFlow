"use client";

import { useEffect, useState } from "react";
import { Plus, Layers, Loader2, AlertTriangle, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

/* 批次列表 + 新建 Modal —— 真实读写 /api/batches
 * 新建 Modal 的"扣费预估"由规格 × 单价 × 封面数算出
 */
export default function BatchesPage() {
  const { toast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    const q = filter === "all" ? "" : `?status=${filter}`;
    const r = await fetch(`/api/batches${q}`);
    const d = await r.json();
    setList(d.data);
  }

  useEffect(() => { refresh(); }, [filter]);

  return (
    <div>
      <header className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-[26px] font-bold">生成批次</h1>
          <p className="text-[13px] text-ink-mute mt-1">一次提交，逐条产出。批次是计费、进度与审阅的统一单位。</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto inline-flex items-center gap-[6px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors shadow-[0_2px_6px_rgba(43,78,255,0.28)]"
        >
          <Plus className="w-[15px] h-[15px]" /> 新建批次
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { k: "all",        label: "全部" },
          { k: "generating", label: "生成中" },
          { k: "done",       label: "已完成" },
          { k: "partial",    label: "部分失败" },
          { k: "cancelled",  label: "已取消" },
        ].map(f => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-[14px] py-1.5 rounded-[8px] text-[13px] font-medium transition-colors ${
              filter === f.k
                ? "bg-brand-50 text-brand-600 font-semibold"
                : "text-ink-sub hover:bg-surface-bg"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-surface-border rounded-md shadow-soft overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-surface-muted border-b border-surface-border text-[12px] text-ink-sub font-semibold uppercase tracking-wider">
              <th className="text-left px-4 py-2.5">批次</th>
              <th className="text-left px-4 py-2.5">标题</th>
              <th className="text-left px-4 py-2.5">档案</th>
              <th className="text-left px-4 py-2.5 w-24">状态</th>
              <th className="text-left px-4 py-2.5 w-[220px]">进度</th>
              <th className="text-left px-4 py-2.5 w-28">费用</th>
              <th className="text-left px-4 py-2.5 w-28">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-ink-mute">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <div className="font-semibold text-ink-sub">暂无批次</div>
              </td></tr>
            )}
            {list.map(b => {
              const pct = Math.round(b.progress.success / Math.max(1, b.progress.total) * 100);
              const statusMap: Record<string, { cls: string; label: string; icon: any }> = {
                generating: { cls: "tag o-blue",   label: "生成中",   icon: Loader2 },
                done:       { cls: "tag o-green",  label: "已完成",   icon: CheckCircle2 },
                partial:    { cls: "tag o-amber",  label: "部分失败", icon: AlertTriangle },
                cancelled:  { cls: "tag o-slate",  label: "已取消",   icon: XCircle },
              };
              const S = statusMap[b.status];
              return (
                <tr key={b.id} className="border-b border-surface-border hover:bg-brand-xxs-100 cursor-pointer" onClick={() => setDetail(b)}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12px] text-ink-sub">{b.id}</div>
                    <div className="text-[11px] text-ink-mute">{b.createdAt.slice(0, 16).replace("T", " ")}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-[11.5px] text-ink-mute mt-0.5">{b.specs.map((s: any) => `${s.type} × ${s.count}`).join(" · ")}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-sub">{b.profileName}</td>
                  <td className="px-4 py-3">
                    <span className={`${S.cls} inline-flex items-center gap-1`}>
                      <S.icon className="w-3 h-3" /> {S.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 bg-[#E9EDF4] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${b.status==='partial'?'bg-warning':'bg-brand-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-ink-sub">
                      {b.progress.success}/{b.progress.total} · {pct}%
                      {b.progress.failed > 0 && <span className="text-danger ml-2">失败 {b.progress.failed}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="font-bold text-brand-500">-{b.credits.deducted}</div>
                    {b.credits.refunded > 0 && <div className="text-[11px] text-success">+{b.credits.refunded} 退还</div>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async (e) => { e.stopPropagation();
                        if (!confirm(`确认取消批次 ${b.id}？未开始条目退还额度，已成功条目保留`)) return;
                        await fetch(`/api/batches/${b.id}/cancel`, { method: "POST" });
                        toast("批次已取消，剩余额度已退还", "ok"); refresh();
                      }}
                      className="btn ghost text-[12px] px-2.5 py-1.5 text-danger hover:bg-danger-soft"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 取消
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Batch Modal */}
      {showModal && (
        <NewBatchModal
          onClose={() => setShowModal(false)}
          onCreated={(id) => { toast(`批次 ${id} 已提交，后台开始生成`, "ok"); setShowModal(false); refresh(); }}
          onError={(m) => toast(m, "err")}
        />
      )}

      {/* Detail Drawer */}
      {detail && <BatchDrawer batch={detail} onClose={() => setDetail(null)} onChanged={refresh} />}
    </div>
  );
}

/* ---------- New Batch Modal ---------- */
function NewBatchModal({ onClose, onCreated, onError }: { onClose: () => void; onCreated: (id: string) => void; onError: (m: string) => void }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selected, setSelected] = useState({ profileId: "", platIds: ["抖音", "小红书"] });
  const [specs, setSpecs] = useState([
    { type: "图文笔记", count: 10 },
    { type: "短视频脚本", count: 5 },
    { type: "口播文案", count: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch("/api/profiles").then(r => r.json()).then(d => { setProfiles(d.data); if (d.data[0]) setSelected(s => ({ ...s, profileId: d.data[0].id })); }); }, []);

  const totalItems = specs.reduce((s, sp) => s + sp.count, 0);
  const estimate = totalItems * 2 + totalItems * 5;

  async function submit() {
    if (!selected.profileId) return onError("请选择档案");
    const s = specs.filter(sp => sp.count > 0).map(sp => ({ type: sp.type as any, count: sp.count }));
    if (!s.length) return onError("请至少选一种内容类型，数量 ≥ 1");
    setSubmitting(true);
    try {
      const r = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "桂花拿铁大促 · 全平台铺量",
          profileId: selected.profileId,
          specs: s,
          platforms: selected.platIds,
          createdBy: "陈曦",
        }),
      });
      if (!r.ok) { const d = await r.json(); return onError(d.error || "创建失败"); }
      const d = await r.json();
      onCreated(d.data.batch.id);
    } catch (e: any) { onError(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-modal w-[680px] max-w-[90vw] max-h-[88vh] flex flex-col animate-slideUp overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-[22px] pt-5 pb-0">
          <h3 className="text-[16px] font-bold">新建生成批次</h3>
          <div className="text-[12px] text-ink-mute mt-1">提交后按配置预扣额度，条目由后台逐条生成</div>
        </div>
        <div className="px-[22px] py-4 overflow-y-auto flex-1">
          {/* 档案选择 */}
          <div className="mb-5">
            <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">关联档案</label>
            <select value={selected.profileId} onChange={e => setSelected({ ...selected, profileId: e.target.value })} className="input w-full">
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name} · {p.category}</option>)}
            </select>
          </div>

          {/* Specs */}
          <div className="mb-5">
            <label className="block text-[12.5px] font-semibold text-ink-sub mb-2">内容类型与数量</label>
            <div className="border border-surface-border rounded-md divide-y divide-surface-border">
              {specs.map((sp, i) => (
                <div key={sp.type} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox" checked={sp.count > 0}
                    onChange={e => setSpecs(specs.map((x, j) => j === i ? { ...x, count: e.target.checked ? 1 : 0 } : x))}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <span className="font-semibold w-[100px]">{sp.type}</span>
                  <input
                    type="range" min={0} max={20} value={sp.count}
                    onChange={e => setSpecs(specs.map((x, j) => j === i ? { ...x, count: +e.target.value } : x))}
                    className="flex-1 accent-brand-500"
                  />
                  <span className="font-mono text-[14px] font-bold text-brand-500 w-[36px] text-right">{sp.count}</span>
                  <span className="text-[12px] text-ink-mute w-[120px]">条 · 2 额度/条</span>
                </div>
              ))}
            </div>
          </div>

          {/* 平台 Chip */}
          <div className="mb-5">
            <label className="block text-[12.5px] font-semibold text-ink-sub mb-2">目标平台调性</label>
            <div className="flex flex-wrap gap-2">
              {["抖音", "小红书", "快手", "视频号", "大众点评"].map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setSelected(s => ({
                    ...s,
                    platIds: s.platIds.includes(p) ? s.platIds.filter(x => x !== p) : [...s.platIds, p],
                  }))}
                  className={`platform-chip ${selected.platIds.includes(p) ? "on" : ""}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Estimate */}
          <div className="mt-4 bg-brand-50 border border-brand-100 rounded-md p-[14px_18px] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-brand-500 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-brand-600">扣费预估：<span className="font-mono text-[18px]">{estimate}</span> 额度</div>
              <div className="text-[12px] text-info mt-0.5">文本 {totalItems} 条 × 2 额度 + 封面 {totalItems} 张 × 5 额度</div>
            </div>
            <div className="bg-white rounded-full px-3 py-1 text-[12px] font-mono text-brand-500 font-bold">将扣 -{estimate}</div>
          </div>
        </div>
        <div className="px-[22px] py-3.5 border-t border-surface-border bg-surface-muted flex justify-end gap-2">
          <button onClick={onClose} className="btn ghost px-4 py-2">取消</button>
          <button disabled={submitting} onClick={submit} className="btn primary px-4 py-2">
            {submitting ? "提交中…" : "确认创建批次"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Batch Drawer ---------- */
function BatchDrawer({ batch, onClose, onChanged }: { batch: any; onClose: () => void; onChanged: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/batches/${batch.id}`).then(r => r.json()).then(d => setItems(d.data.items || []));
  }, [batch.id]);

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/40 animate-fadeIn" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-[520px] max-w-[92vw] bg-white border-l border-surface-border z-[95] flex flex-col animate-slideUp shadow-modal">
        <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
          <h3 className="font-bold flex-1">{batch.title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md grid place-items-center text-ink-sub hover:bg-surface-bg">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute mb-2">批次信息</div>
          <dl className="grid grid-cols-[110px_1fr] text-[13px] gap-1.5 mb-6">
            <dt className="text-ink-sub">批次 ID</dt><dd className="font-mono">{batch.id}</dd>
            <dt className="text-ink-sub">档案</dt><dd>{batch.profileName}</dd>
            <dt className="text-ink-sub">创建人</dt><dd>{batch.createdBy}</dd>
            <dt className="text-ink-sub">创建时间</dt><dd>{batch.createdAt.slice(0, 16).replace("T", " ")}</dd>
            <dt className="text-ink-sub">目标平台</dt><dd>{batch.platforms.join(" · ")}</dd>
          </dl>

          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute mb-2">整体进度</div>
          <div className="h-1.5 bg-[#E9EDF4] rounded-full overflow-hidden mb-2">
            <div className={`h-full rounded-full bg-brand-500 transition-all duration-700 ${batch.status==='partial'?'bg-warning':''}`} style={{ width: `${Math.round(batch.progress.success/Math.max(1,batch.progress.total)*100)}%` }} />
          </div>
          <div className="text-[12px] mb-6 flex gap-4">
            <span className="text-success">成功 {batch.progress.success}</span>
            {batch.progress.failed > 0 && <span className="text-danger">失败 {batch.progress.failed}</span>}
            {batch.progress.running > 0 && <span className="text-brand-500">进行中 {batch.progress.running}</span>}
            <span className="ml-auto text-ink-sub">总计 {batch.progress.total}</span>
          </div>

          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute mb-2">费用</div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "预估", v: batch.credits.estimated, cls: "text-ink-sub" },
              { label: "实扣", v: batch.credits.deducted, cls: "text-brand-500" },
              { label: "退还", v: batch.credits.refunded, cls: "text-success" },
            ].map(f => (
              <div key={f.label} className="bg-white border border-surface-border rounded-md p-3 text-center">
                <div className="text-[11px] text-ink-mute font-semibold">{f.label}</div>
                <div className={`mt-0.5 font-mono text-[20px] font-extrabold ${f.cls}`}>{f.v}</div>
              </div>
            ))}
          </div>

          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-mute mb-2">已产出条目（{items.length}）</div>
          <div className="space-y-2">
            {items.map((it: any) => (
              <div key={it.id} className="px-3 py-2.5 border border-surface-border rounded-md hover:border-brand-500 transition-colors cursor-pointer">
                <div className="font-semibold text-[13px] truncate">{it.title}</div>
                <div className="text-[11px] text-ink-mute flex gap-2 mt-1">
                  <span className="tag o-blue" style={{padding:0}}>{it.type}</span>
                  <span>{it.platforms.join(" / ")}</span>
                  <span className="ml-auto">{it.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
