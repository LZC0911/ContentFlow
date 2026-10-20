/**
 * 全库数据类型定义 —— 单一真源
 * 状态枚举与 PRD §4 对象模型严格对齐
 */

export type ProfileType = "product" | "store" | "brand";

export interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  category: string;
  highlights: string[];          // 卖点，AI 轮换使用
  audience: string;
  promo?: string;
  tone: "亲切" | "专业" | "高端" | "活泼" | "自定义";
  toneCustom?: string;
  forbiddenWords: string[];      // 硬拦截，PRD §4.2
  createdAt: string;             // ISO
  coverGradient?: string;        // 原型演示用（真实后端可删）
}

/* 批次状态机（PRD §4.2.1） */
export type BatchStatus = "configuring" | "generating" | "done" | "partial" | "cancelled";

export interface BatchItemSpec {
  type: ContentType;
  count: number;
}

export type ContentType = "图文笔记" | "短视频脚本" | "口播文案";

export interface Batch {
  id: string;
  title: string;
  profileId: string;
  profileName: string;
  status: BatchStatus;
  specs: BatchItemSpec[];                    // 配置
  platforms: string[];                       // 目标平台调性
  createdAt: string;
  createdBy: string;
  credits: { estimated: number; deducted: number; refunded: number };
  progress: { total: number; success: number; failed: number; running: number };
  // 进度跟踪
  itemIds: string[];
  failedIds: string[];
}

/* 条目状态机（PRD §4.2.2） */
export type ItemStatus = "generating" | "pending" | "passed" | "rejected";

export interface GeneratedCover {
  gradient: string;
  text: string;
  sub?: string;
}

export interface ContentItem {
  id: string;
  batchId: string;
  profileId: string;
  type: ContentType;
  platforms: string[];
  title: string;
  body: string;                                // 图文/口播正文，或脚本
  covers: GeneratedCover[];
  compliance: {
    hardBlock: string[];                        // 命中禁用词
    warning: string[];                         // 广告法/平台规范
    info: string[];                            // 建议
  };
  status: ItemStatus;
  createdAt: string;
  passedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  creditsCost: number;                         // 2 额度（PRD §7.1）
}

/* 合规检查结果（API 返回） */
export interface ComplianceCheck {
  hardBlock: string[];
  warning: string[];
  info: string[];
}

/* 额度钱包（PRD §4.2.4） */
export interface Credits {
  plan: "free" | "pro" | "team";
  monthlyTotal: number;
  monthlyUsed: number;
  addon: number;        // 加购额度（不过期）
  frozen: number;       // 预扣中
  renewsAt: string;     // 下次月度额度重置日期
}

/* 费用明细（PRD §7） */
export type BillType = "生成" | "退还" | "订阅扣费" | "加购";
export interface Bill {
  id: string;
  time: string;
  actor: string;
  type: BillType;
  detail: string;
  cost: number;     // 负数=扣减，正数=退还
  wallet: "monthly" | "addon";
}

/* 成员 */
export type MemberRole = "admin" | "member";
export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
}

/* 环境配置 */
export interface AppConfig {
  openAiKey?: string;
  openAiModel: string;
  llmFallback: boolean;           // key 未配置时自动 fallback 到 canned 文案
  stripeSecret?: string;
  stripeWebhookSecret?: string;
  // 计费单价（PRD §7.1，全部 TBD 占位）
  pricePerContent: number;        // 2 额度/条
  pricePerCover: number;          // 5 额度/张
}
