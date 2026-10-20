/**
 * LLM Provider —— 唯一出口
 * 真实环境：调用 OpenAI（gpt-4o-mini 起手，可切换 gpt-4o）
 * 开发环境 / key 未配置：自动 fallback 到 canned 文案（占位但保持真实 JSON 结构）
 *
 * 抽象：后续接 Claude 3.5 Sonnet / Gemini 时只需新增 provider 函数
 */

import OpenAI from "openai";
import { Profile, ContentType, GeneratedCover } from "./types";
import { CONFIG } from "./store";

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (client || !CONFIG.openAiKey) return client;
  client = new OpenAI({ apiKey: CONFIG.openAiKey });
  return client;
}

/* ---------- Prompt 构造 ---------- */
function buildSystemPrompt(): string {
  return `你是一名专业的中文社交媒体内容创作者。
请严格按 JSON 输出（不要 markdown）。

任务：根据商品/门店档案信息，生成一条可在指定平台发布的内容。

内容类型说明：
- 图文笔记：小红书/抖音风格，带话题标签
- 短视频脚本：分镜 【时间·画面·字幕卡·旁白】四栏格式，结构清晰
- 口播文案：15-30s 口语化文案，自然流畅

输出字段：
{
  "title": string,            // 标题，控制在各平台推荐长度
  "body": string,             // 正文或脚本
  "cover_text": string,       // 封面主标题（≤4字）
  "cover_sub": string         // 封面副标题（≤8字，可选）
}`;
}

function buildUserPrompt(
  type: ContentType,
  profile: Profile,
  platforms: string[],
  index: number
): string {
  // 卖点轮换策略：用 index 轮换卖点，让不同条目有差异化
  const highlightRotated = [...profile.highlights].sort((a, b) =>
    (index / (profile.highlights.length + 1)) % 2 ? 1 : -1
  );
  const mainHighlight = highlightRotated[Math.floor(index) % profile.highlights.length];

  return [
    `档案名称：${profile.name}`,
    `类目：${profile.category}`,
    `目标人群：${profile.audience}`,
    `品牌调性：${profile.tone}${profile.toneCustom ? "（" + profile.toneCustom + "）" : ""}`,
    `促销信息：${profile.promo || "无"}`,
    `当前重点卖点：${mainHighlight}`,
    `完整卖点列表：${profile.highlights.map(h => "- " + h).join("\n")}`,
    `禁用词（输出内容不得出现）：${profile.forbiddenWords.join("、") || "无"}`,
    `目标平台：${platforms.join("、")}`,
    `内容类型：${type}`,
    `差异化方向：卖点轮换 · 这是本批次第 ${index + 1} 条，请避免与前几条重复`,
    "",
    "请直接输出 JSON，不要其他文字。",
  ].join("\n");
}

/* ---------- 真实 LLM 调用 ---------- */
async function callLLM(system: string, user: string): Promise<{
  title: string; body: string; coverText: string; coverSub?: string;
}> {
  const c = getClient();
  if (!c) throw new Error("OpenAI not configured");

  const resp = await c.chat.completions.create({
    model: CONFIG.openAiModel,
    temperature: 0.85,
    max_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = resp.choices[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

/* ---------- Fallback：canned 文案（key 未配时） ---------- */
function fallbackCanned(
  type: ContentType,
  profile: Profile,
  platforms: string[],
  index: number
): { title: string; body: string; coverText: string; coverSub?: string } {
  const pts = platforms.join("/");
  const mainH = profile.highlights[Math.floor(index) % profile.highlights.length];

  if (type === "图文笔记") {
    const tones = ["把春天装进杯子里", "办公室偷偷收藏的宝藏店", "这杯我能喝一辈子", "被低估的神仙店"];
    const title = `${tones[Math.floor(index) % tones.length]} · ${profile.name.replace(/.*·/, "").trim()}`;
    return {
      title,
      body: `${mainH}\n\n📍 坐标：${profile.name}\n💰 价格参考：${profile.promo || "大众点评搜一下"}\n\n「${profile.audience}」必收藏的店 ——\n\n${Math.floor(index) % 2 === 0
        ? "工作日早鸟时段人最少，下午 2 点左右排队 15 分钟。"
        : "新品刚上架那段时间奶泡最绵密，服务员说打奶泡的师傅是拿过 COE 银奖的"}

最近${pts}上越来越火，趁没排长队赶紧去 ——\n\n#探店 #${profile.category} #${profile.name}`,
      coverText: "宝藏",
      coverSub: mainH.slice(0, 6),
    };
  }
  if (type === "短视频脚本") {
    const shortTitle = `${mainH.slice(0, 12)} · 30s 速看`;
    return {
      title: shortTitle,
      body: `【画面 0-3s · 街头跟随】傍晚的街景、落叶、镜头从街对面摇过来\n【字幕卡：${shortTitle}】\n【旁白：「${profile.name}，藏在${profile.category}里的惊喜」】\n\n【画面 4-15s · 店内 B-roll】手冲壶水流、奶泡拉花特写\n【旁白：「${mainH}」】\n\n【画面 16-24s · 成品展示】撒上干桂花 + 近景特写\n【字幕：${profile.promo || "欢迎打卡"}】\n\n【画面 25-30s · 主播口播】「定位里搜${profile.name}，最近有活动，冲！」`,
      coverText: "速看",
      coverSub: mainH.slice(0, 6),
    };
  }
  // 口播文案
  return {
    title: `${profile.name} · 15s 口播稿`,
    body: `「今天给大家推荐${profile.name}—— ${mainH}。\n\n${profile.promo ? "现在还有" + profile.promo + "，" : ""}就在${profile.category}附近，定位里搜一下就能找到。\n\n${profile.audience ? "适合" + profile.audience + "，" : ""}收藏起来，下次想打卡的时候直接冲！」`,
    coverText: "口播",
    coverSub: profile.name.replace(/.*·/, "").trim().slice(0, 8),
  };
}

/* ---------- 封面渐变颜色池 ---------- */
const GRADIENTS = [
  "#D4A373", "#9C6644", "#B08968", "#6B8E9E",
  "#E8B899", "#4F6D7A", "#7B5C3E", "#F4A261",
];
function pickCoverColors(i: number): { gradient: string; grad: string } {
  const a = GRADIENTS[i % GRADIENTS.length];
  const b = GRADIENTS[(i + 3) % GRADIENTS.length];
  return { gradient: `${a} → ${b}`, grad: `${a}→${b}` };
}

/* ---------- 对外入口 ---------- */
export async function llmGenerate(
  type: ContentType,
  profile: Profile,
  platforms: string[],
  index: number
): Promise<{
  title: string; body: string; covers: GeneratedCover[];
}> {
  let result;
  if (CONFIG.openAiKey) {
    try {
      result = await callLLM(
        buildSystemPrompt(),
        buildUserPrompt(type, profile, platforms, index)
      );
    } catch (e) {
      // LLM 失败自动 fallback，保证主链路不崩
      console.error("[LLM] call failed, falling back to canned:", (e as Error).message);
      result = fallbackCanned(type, profile, platforms, index);
    }
  } else {
    result = fallbackCanned(type, profile, platforms, index);
  }

  const c1 = pickCoverColors(index);
  const c2 = pickCoverColors(index + 3);
  const c3 = pickCoverColors(index + 7);

  const covers: GeneratedCover[] = [
    { gradient: c1.grad, text: result.coverText || "内容", sub: result.coverSub },
  ];
  // 图文笔记默认 2-3 张封面候选
  if (type === "图文笔记") {
    covers.push({ gradient: c2.grad, text: result.coverText || "内容", sub: result.coverSub });
    covers.push({ gradient: c3.grad, text: profile.name.slice(0, 6), sub: "候选" });
  }

  return {
    title: result.title.slice(0, 60),
    body: result.body,
    covers,
  };
}
