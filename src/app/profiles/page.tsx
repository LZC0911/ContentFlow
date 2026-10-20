"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

/* 档案列表 + 新建 Modal —— 真实读写 /api/profiles */
export default function ProfilesPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);

  async function refresh() {
    const r = await fetch("/api/profiles");
    setProfiles((await r.json()).data);
  }
  useEffect(() => { refresh(); }, []);

  async function create(data: any) {
    const r = await fetch("/api/profiles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) return toast(d.error, "err");
    toast("档案创建成功", "ok");
    setShowNew(false);
    refresh();
  }

  return (
    <div>
      <header className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-[26px] font-bold">商品与品牌档案</h1>
          <p className="text-[13px] text-ink-mute mt-1">一次建档，多批次复用。{profiles.length} 个档案已创建。</p>
        </div>
        <button onClick={() => setShowNew(true)} className="ml-auto inline-flex items-center gap-[6px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors shadow-[0_2px_6px_rgba(43,78,255,0.28)]">
          <Plus className="w-[15px] h-[15px]" /> 新建档案
        </button>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
        {profiles.map(p => (
          <div key={p.id} className="bg-white border border-surface-border rounded-md shadow-soft overflow-hidden hover:shadow-card transition-shadow cursor-pointer">
            <div className="h-[96px]" style={{ background: `linear-gradient(135deg, ${(p as any).coverGradient || "#C47849"} 0%, rgba(0,0,0,.25) 100%)` }}>
              <div className="px-4 pt-3">
                <span className="tag o-blue">{p.type === "store" ? "门店" : p.type === "product" ? "商品" : "品牌通用"}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="font-bold text-[15px] mb-1">{p.name}</div>
              <div className="text-[12px] text-ink-sub mb-3">{p.category}{p.subCategory ? " · " + p.subCategory : ""}</div>
              <div className="font-semibold text-[12px] text-ink-sub mb-1.5">卖点（{p.highlights.length} 条）</div>
              <ul className="text-[12px] text-[#42506b] space-y-1 mb-3">
                {p.highlights.slice(0, 2).map((h: string) => (
                  <li key={h} className="flex gap-1.5">
                    <span className="text-brand-500 mt-0.5">·</span><span className="line-clamp-1">{h}</span>
                  </li>
                ))}
              </ul>
              {p.forbiddenWords.length > 0 && (
                <div className="mb-3">
                  <div className="text-[11px] text-ink-mute font-bold mb-1">禁用词</div>
                  <div className="flex flex-wrap gap-1">
                    {p.forbiddenWords.map((w: string) => <span key={w} className="tag o-red">{w}</span>)}
                  </div>
                </div>
              )}
              <div className="text-[11px] text-ink-mute flex gap-3">
                <span>创建 {p.createdAt.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNew && <NewProfileModal onClose={() => setShowNew(false)} onCreate={create} />}
    </div>
  );
}

function NewProfileModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: any) => void }) {
  const [form, setForm] = useState({
    name: "", type: "product" as "product" | "store" | "brand", category: "",
    highlights: ["", "", ""], audience: "", promo: "", tone: "亲切" as const,
    forbiddenWords: [] as string[], newForbidden: "", coverGradient: "#C47849→#7A3C10",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-modal w-[640px] max-w-[90vw] max-h-[88vh] flex flex-col animate-slideUp overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-[22px] pt-5 pb-0">
          <h3 className="text-[16px] font-bold">新建商品档案</h3>
          <div className="text-[12px] text-ink-mute mt-1">字段越完整，AI 生成越精准</div>
        </div>
        <div className="px-[22px] py-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">档案名称</label>
              <input className="input w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如：2026 秋冬限定系列" />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">档案类型</label>
              <select className="select w-full" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
                <option value="product">电商商品</option>
                <option value="store">线下门店</option>
                <option value="brand">品牌通用</option>
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">类目</label>
              <input className="input w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="例如：精品咖啡馆" />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">核心卖点（AI 会轮换使用）</label>
            <div className="space-y-2">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" value={h} onChange={e => { const copy = [...form.highlights]; copy[i] = e.target.value; setForm({ ...form, highlights: copy }); }} placeholder={`卖点 ${i + 1}`} />
                  {form.highlights.length > 1 && (
                    <button onClick={() => setForm({ ...form, highlights: form.highlights.filter((_, j) => j !== i) })} className="btn ghost text-[12px] px-3 py-1.5">删</button>
                  )}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, highlights: [...form.highlights, ""] })} className="btn ghost text-[12px] px-3 py-1.5">+ 添加卖点</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">目标人群</label>
              <input className="input w-full" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} placeholder="例如：22-32 岁一线城市白领" />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">品牌调性</label>
              <select className="select w-full" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value as any })}>
                {["亲切", "专业", "高端", "活泼", "自定义"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">价格与促销信息</label>
            <textarea className="textarea w-full" value={form.promo} onChange={e => setForm({ ...form, promo: e.target.value })} placeholder="例如：中杯 ¥26 大杯 ¥32，买 2 杯赠书签" />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-ink-sub mb-1.5">禁用词（AI 命中即拦截）</label>
            <div className="border border-surface-border rounded-md p-3 flex flex-wrap gap-2 items-center min-h-[40px]">
              {form.forbiddenWords.map(w => (
                <span key={w} className="tag o-red flex items-center gap-1">
                  {w}
                  <button onClick={() => setForm({ ...form, forbiddenWords: form.forbiddenWords.filter(x => x !== w) })} className="hover:opacity-60">×</button>
                </span>
              ))}
              <input
                className="border-none outline-none flex-1 min-w-[140px] text-[13px]"
                placeholder="输入后回车添加"
                value={form.newForbidden}
                onChange={e => setForm({ ...form, newForbidden: e.target.value })}
                onKeyDown={e => {
                  if (e.key === "Enter" && form.newForbidden.trim()) {
                    setForm({ ...form, forbiddenWords: [...form.forbiddenWords, form.newForbidden.trim()], newForbidden: "" });
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="px-[22px] py-3.5 border-t border-surface-border bg-surface-muted flex justify-end gap-2">
          <button onClick={onClose} className="btn ghost px-4 py-2">取消</button>
          <button
            disabled={!form.name || !form.category || !form.highlights.some(h => h.trim()) || !form.audience}
            onClick={() => onCreate({
              name: form.name, type: form.type, category: form.category,
              highlights: form.highlights.filter(h => h.trim()),
              audience: form.audience, promo: form.promo, tone: form.tone,
              forbiddenWords: form.forbiddenWords, coverGradient: form.coverGradient,
            })}
            className="btn primary px-4 py-2">保存档案</button>
        </div>
      </div>
    </div>
  );
}
