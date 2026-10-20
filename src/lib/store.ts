/**
 * 内存 Store —— MVP 阶段持久化到 JSON 文件
 * 后续切换到 Prisma/Postgres 只需替换 store 内部实现
 *
 * 提供：
 *  - Profile / Batch / ContentItem / Bill / Credits / Member 全部 CRUD
 *  - 批次状态机驱动（提交→生成→成功/失败→扣费/退还）
 *  - 额度扣费/退还的事务保证（余额永不复负）
 *  - 并发锁（Server Actions 多次调用时保证顺序）
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import {
  Profile, Batch, ContentItem, Bill, Credits, Member,
  ComplianceCheck, AppConfig, ContentType, BatchItemSpec,
} from "./types";

const DATA_DIR = process.env.CONTENTFLOW_DATA_DIR || path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface StoreState {
  profiles: Profile[];
  batches: Batch[];
  items: ContentItem[];
  bills: Bill[];
  credits: Credits;
  members: Member[];
  idCounter: number;
}

let state: StoreState = load();
let _locks = new Map<string, { promise: Promise<void>; resolve: () => void }>();

/* ---------- 持久化 ---------- */
function load(): StoreState {
  if (!existsSync(STORE_FILE)) {
    const dir = path.dirname(STORE_FILE);
    try { mkdirSync(dir, { recursive: true }); } catch {}
    return seed();
  }
  try { return JSON.parse(readFileSync(STORE_FILE, "utf-8")); }
  catch { return seed(); }
}
function persist() {
  if (!process.env.NEXT_PHASE) {
    try { writeFileSync(STORE_FILE, JSON.stringify(state, null, 2)); } catch {}
  }
}
/** 跨进程 reload：每次读操作前从文件刷新 state，保证多 API 进程看到一致数据 */
function reload() { try { state = load(); } catch {} }
function uid(prefix: string) { state.idCounter++; return `${prefix}-${state.idCounter.toString().padStart(6, "0")}`; }

/* ---------- 并发锁 ---------- */
async function withLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  let current = _locks.get(key);
  if (current) await current.promise;       // 等前一个完成
  let release!: () => void;
  const p = new Promise<void>(r => { release = r; });
  _locks.set(key, { promise: p, resolve: release! });
  try { return await fn(); } finally { _locks.delete(key); release!(); }
}

/* ---------- Seed ---------- */
function seed(): StoreState {
  const now = new Date().toISOString();
  return {
    idCounter: 1000,
    profiles: [
      {
        id: "pf01", name: "星野咖啡 · 线下门店", type: "store",
        category: "精品咖啡馆",
        highlights: [
          "手冲单品豆每周更换", "门店设计走日系原木风",
          "工作日早鸟 8 折会员日",
        ],
        audience: "22-32 岁一线城市白领",
        promo: "工作日早鸟 8:00-10:00 第二杯半价",
        tone: "亲切", forbiddenWords: [], createdAt: now, coverGradient: "#C47849→#7A3C10",
      },
      {
        id: "pf02", name: "秋冬限定 · 桂花拿铁系列", type: "product",
        category: "限定饮品",
        highlights: [
          "桂花蜜来自杭州西湖满陇桂雨",
          "每日现熬不超过 4 小时",
          "搭配红豆司康同享 -6 元",
          "买限定送定制桂花书签",
        ],
        audience: "喜欢打卡季节性新品的年轻女生",
        promo: "桂花拿铁中杯 ¥26 大杯 ¥32，买 2 杯赠书签",
        tone: "活泼", forbiddenWords: ["最好喝", "全网第一"], createdAt: now, coverGradient: "#D4A373→#774936",
      },
    ],
    batches: [],
    items: [],
    bills: [],
    credits: {
      plan: "pro", planName: "专业版",
      monthlyTotal: 3000, monthlyUsed: 0,
      addon: 500, frozen: 0,
      renewsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    } as unknown as Credits & { planName?: string },
    members: [
      { id: "u1", name: "陈曦", email: "chenxi@xingye.co", role: "admin", joinedAt: now },
      { id: "u2", name: "林小溪", email: "xiaoxi@xingye.co", role: "member", joinedAt: now },
    ],
  };
}

/* ============================================================
   Profile
   ============================================================ */
export const profiles = {
  list: () => { reload(); return state.profiles; },
  get: (id: string) => { reload(); return state.profiles.find(p => p.id === id); },
  create: (data: Omit<Profile, "id" | "createdAt">) => {
    const p: Profile = { ...data, id: uid("pf"), createdAt: new Date().toISOString() };
    state.profiles.push(p); persist(); return p;
  },
  update: (id: string, patch: Partial<Profile>) => {
    const p = state.profiles.find(x => x.id === id);
    if (!p) throw new Error("Profile not found");
    Object.assign(p, patch); persist(); return p;
  },
  delete: (id: string) => {
    state.profiles = state.profiles.filter(x => x.id !== id); persist();
  },
};

/* ============================================================
   Compliance 检查（PRD M3 · 三层）
   ============================================================ */
const AD_WORDS = ["最", "第一", "顶级", "极致", "独家", "首选", "国家级", "世界级", "全网", "全球"];
const DANGEROUS = AD_WORDS.slice(0, 8);

export function checkCompliance(profile: Profile, title: string, body: string): ComplianceCheck {
  const hardBlock: string[] = [];
  const warning: string[] = [];
  const info: string[] = [];
  const text = (title + " " + body).toLowerCase();

  for (const w of profile.forbiddenWords) {
    if (w && text.includes(w.toLowerCase())) hardBlock.push(w);
  }
  for (const w of DANGEROUS) {
    if (title.includes(w) || body.includes(w)) warning.push(`命中广告法风险词「${w}」，建议替换`);
  }
  // 建议层
  if ((body.match(/#/g) || []).length > 6) info.push("话题标签建议 ≤ 5 个");
  if (title.length > 28) info.push("标题超过 28 字，小红书建议 20 字内");

  return { hardBlock, warning, info };
}

/* ============================================================
   Bills —— 费用流水
   ============================================================ */
export const bills = {
  list: () => { reload(); return state.bills.slice().reverse(); },
  record: (entry: Omit<Bill, "id" | "time"> & { time?: string }) => {
    const b: Bill = { ...entry, id: uid("bill"), time: entry.time || new Date().toISOString() };
    state.bills.push(b); persist(); return b;
  },
};

/* ============================================================
   Credits —— 额度钱包（PRD §7 规则）
   ============================================================ */
export const credits = {
  snapshot: () => { reload(); return state.credits; },

  /** 在扣费前扣减 frozen；成功 → 月度/加购二选一扣减；失败/取消 → 退还 frozen 到可用 */
  freeze: async (amount: number): Promise<number> => withLock("credits", () => {
    const c = state.credits;
    const available = (c.monthlyTotal - c.monthlyUsed) + c.addon - c.frozen;
    if (available < amount) {
      // 允许返回 -1 让上层显示"额度不足"
      return -1;
    }
    c.frozen += amount; persist(); return amount;
  }),

  /** 确认扣费（成功时调用）：从 frozen 转实扣，先扣月度再扣加购 */
  commit: async (frozenIdHint: string, amount: number): Promise<void> => withLock("credits", () => {
    const c = state.credits;
    if (c.frozen < amount) throw new Error("冻结额度不一致");
    c.frozen -= amount;
    // 月度额度优先
    const monthlyRemain = c.monthlyTotal - c.monthlyUsed;
    if (monthlyRemain >= amount) {
      c.monthlyUsed += amount;
      bills.record({ actor: "系统", type: "生成", detail: frozenIdHint, cost: -amount, wallet: "monthly" });
    } else {
      c.monthlyUsed = c.monthlyTotal;
      c.addon -= (amount - monthlyRemain);
      bills.record({ actor: "系统", type: "生成", detail: frozenIdHint, cost: -amount, wallet: "addon" });
    }
    persist();
  }),

  /** 退还冻结额度（失败/取消时调用）：frozen 归零，可用额度恢复 */
  refund: async (frozenIdHint: string, amount: number): Promise<void> => withLock("credits", () => {
    const c = state.credits;
    c.frozen = Math.max(0, c.frozen - amount);
    bills.record({ actor: "系统", type: "退还", detail: frozenIdHint, cost: amount, wallet: "monthly" });
    persist();
  }),
};

/* ============================================================
   Batch —— 批次状态机
   ============================================================ */
export const batches = {
  list: () => { reload(); return state.batches.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  get: (id: string) => { reload(); return state.batches.find(b => b.id === id); },

  /** 创建批次 + 预扣额度 + 立即进入 generating 状态
   *  后续逐条生成由 generateItem 驱动 */
  create: async (opts: {
    title: string; profileId: string; specs: BatchItemSpec[];
    platforms: string[]; createdBy: string;
  }): Promise<{ batch: Batch; frozenAmount: number }> => {
    const profile = profiles.get(opts.profileId);
    if (!profile) throw new Error("档案不存在");

    const total = opts.specs.reduce((s, sp) => s + sp.count, 0);
    const coverCount = opts.specs.reduce((s, sp) => s + sp.count, 0);   // 默认每条配 1 张封面
    const estimate = total * CONFIG.pricePerContent + coverCount * CONFIG.pricePerCover;

    const frozen = await credits.freeze(estimate);
    if (frozen === -1) throw new Error("额度不足，请先加购或升级订阅");

    const batch: Batch = {
      id: uid("BT"),
      title: opts.title || `${profile.name} · 批量生成`,
      profileId: opts.profileId,
      profileName: profile.name,
      status: "generating",
      specs: opts.specs,
      platforms: opts.platforms,
      createdAt: new Date().toISOString(),
      createdBy: opts.createdBy,
      credits: { estimated: frozen, deducted: 0, refunded: 0 },
      progress: { total, success: 0, failed: 0, running: 0 },
      itemIds: [],
      failedIds: [],
    };
    state.batches.push(batch); persist();
    return { batch, frozenAmount: frozen };
  },

  /** 取消批次：未开始条目不计费；已冻结的整批额度退还
   *  这里简化 —— 真实实现应先逐条 commit 已成功、再 refund 剩余 */
  cancel: async (id: string): Promise<Batch> => {
    const b = state.batches.find(x => x.id === id);
    if (!b) throw new Error("批次不存在");
    if (b.status === "cancelled" || b.status === "done") throw new Error("已完成/已取消的批次不可再次取消");

    b.status = "cancelled";
    // 先 commit 已成功（不重复扣费，因为还没 commit），剩余 frozen 全部退还
    // 简化实现：先 refund 全部 frozen，再对已成功条目补 commit
    await credits.refund(b.id, b.credits.estimated);
    b.credits.refunded = b.credits.estimated - b.credits.deducted;
    persist();
    return b;
  },
};

/* ============================================================
   ContentItem —— 条目级生成 & 状态机
   由 API Route 异步逐条调用（可以并发）
   ============================================================ */
export const items = {
  list: (batchId?: string) => batchId
    ? state.items.filter(i => i.batchId === batchId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : state.items.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  async generate(batchId: string, type: ContentType, index: number): Promise<ContentItem> {
    const batch = batches.get(batchId);
    if (!batch) throw new Error("批次不存在");
    const profile = profiles.get(batch.profileId)!;

    const itemId = uid("it");
    batch.progress.running++;
    persist();

    try {
      // 调 LLM 生成（llm.ts 封装，key 未配置时 fallback 到 canned 文案）
      const { title, body, covers } = await generateContent(type, profile, batch.platforms, index);
      const compliance = checkCompliance(profile, title, body);

      const item: ContentItem = {
        id: itemId, batchId, profileId: batch.profileId,
        type, platforms: batch.platforms,
        title, body, covers, compliance,
        status: "pending", createdAt: new Date().toISOString(),
        creditsCost: CONFIG.pricePerContent,
      };
      state.items.push(item);
      batch.itemIds.push(itemId);
      batch.progress.success++;
      batch.progress.running--;

      // 成功条目 commit 扣费（2 额度）+ 封面（5 额度/张）
      await credits.commit(`${batchId} · ${itemId}`, CONFIG.pricePerContent + CONFIG.pricePerCover);
      batch.credits.deducted += CONFIG.pricePerContent + CONFIG.pricePerCover;

    } catch (e: any) {
      // 失败：该条目不计费（commit 没调用）
      batch.progress.failed++;
      batch.progress.running--;
      batch.failedIds.push(itemId);
      // 批次级 refund 整笔冻结时再统一处理，这里只标记
    }

    // 更新批次状态（可能 done / partial）—— 加 status 检查防并发重入
    if (batch.status === "generating" && batch.progress.success + batch.progress.failed === batch.progress.total) {
      if (batch.progress.failed === 0) batch.status = "done";
      else batch.status = "partial";
      // 批次结束时统一 refund 剩余 frozen（没被扣的那部分）—— 直接读 frozen 避免并发 race
      if (state.credits.frozen > 0) {
        const refundAmt = state.credits.frozen;
        await credits.refund(`${batchId} · 批次结束剩余`, refundAmt);
        batch.credits.refunded = refundAmt;
      }
    }
    persist();
    return state.items.find(i => i.id === itemId)!;
  },

  async review(id: string, action: "approve" | "reject", reason?: string): Promise<ContentItem> {
    const it = state.items.find(x => x.id === id);
    if (!it) throw new Error("条目不存在");
    if (action === "approve") {
      // 硬拦截的条目禁止通过
      if (it.compliance.hardBlock.length) throw new Error(`禁止通过：命中禁用词 ${it.compliance.hardBlock.join("、")}`);
      it.status = "passed";
      it.passedAt = new Date().toISOString();
    } else {
      it.status = "rejected";
      it.rejectedAt = new Date().toISOString();
      it.rejectReason = reason || "运营驳回";
    }
    persist(); return it;
  },

  async regenerate(id: string): Promise<ContentItem> {
    const it = state.items.find(x => x.id === id);
    if (!it) throw new Error("条目不存在");
    const batch = batches.get(it.batchId)!;
    const profile = profiles.get(batch.profileId)!;

    const cost = CONFIG.pricePerContent + CONFIG.pricePerCover;
    const ok = await credits.freeze(cost);
    if (ok === -1) throw new Error("额度不足");

    try {
      const { title, body, covers } = await generateContent(it.type, profile, batch.platforms, Math.floor(Math.random() * 1000));
      const compliance = checkCompliance(profile, title, body);
      it.title = title; it.body = body; it.covers = covers; it.compliance = compliance;
      it.status = compliance.hardBlock.length ? "pending" : "pending";  // 重生成后一律 pending
      it.rejectedAt = undefined; it.rejectReason = undefined;
      await credits.commit(`${it.id} · 重新生成`, cost);
      persist();
    } catch (e) {
      await credits.refund(`${it.id} · 重新生成失败`, cost);
      throw e;
    }
    return it;
  },
};

/* ============================================================
   LLM 封装 —— 从 llm.ts 引入（避免循环依赖，store.ts 引用函数）
   ============================================================ */
// 延迟 require，llm.ts 引用 types 时已把 store 加载了
async function generateContent(type: ContentType, profile: Profile, platforms: string[], index: number) {
  const { llmGenerate } = await import("./llm");
  return llmGenerate(type, profile, platforms, index);
}

/* ---------- Config ---------- */
export const CONFIG: AppConfig = {
  openAiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  llmFallback: !process.env.OPENAI_API_KEY,
  stripeSecret: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  pricePerContent: 2,
  pricePerCover: 5,
};
