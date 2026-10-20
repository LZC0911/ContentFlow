import { NextResponse } from "next/server";
import { z } from "zod";
import { profiles, batches, CONFIG } from "@/lib/store";
import { ContentType } from "@/lib/types";

/* GET /api/batches — 列表（可查状态筛选） */
export async function GET(req: Request) {
  const params = new URLSearchParams(req.url.split("?")[1] || "");
  const status = params.get("status");
  let list = batches.list();
  if (status) list = list.filter(b => b.status === status);
  return NextResponse.json({ data: list });
}

/* POST /api/batches — 创建批次 + 预扣额度 + 后台逐条生成
 * 生成采用 fire-and-forget —— 主请求立即返回批次 + 预估扣费
 * 生成任务由 Edge Runtime 并发驱动（在 Next.js 里用 Promise.all 不阻塞返回）
 */
const CreateSchema = z.object({
  title: z.string().min(1).max(80),
  profileId: z.string(),
  specs: z.array(z.object({
    type: z.enum(["图文笔记", "短视频脚本", "口播文案"] as const),
    count: z.number().min(1).max(20),
  })).min(1),
  platforms: z.array(z.string()).min(1).max(5),
  createdBy: z.string().default("系统"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "参数错误" },
      { status: 400 }
    );
  }
  const profile = profiles.get(parsed.data.profileId);
  if (!profile) return NextResponse.json({ error: "档案不存在" }, { status: 404 });

  let batch;
  try {
    ({ batch } = await batches.create(parsed.data));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 402 });
  }

  // 后台逐条生成 —— fire and forget
  const allSpecs = parsed.data.specs.flatMap(s =>
    Array.from({ length: s.count }).map(() => s.type as ContentType)
  );
  queueMicrotask(async () => {
    try {
      // 并发度 3，避免并发 LLM 调用打爆配额
      const chunks: ContentType[][] = [];
      for (let i = 0; i < allSpecs.length; i += 3) {
        chunks.push(allSpecs.slice(i, i + 3));
      }
      let globalIdx = 0;
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(type =>
            import("@/lib/store").then(m => m.items.generate(batch!.id, type, globalIdx++))
          )
        );
        await new Promise(r => setTimeout(r, 400)); // 轻微节流
      }
    } catch (e) { console.error("[batch worker]", e); }
  });

  const total = parsed.data.specs.reduce((s, sp) => s + sp.count, 0);
  const estimate = total * CONFIG.pricePerContent + total * CONFIG.pricePerCover;
  return NextResponse.json({
    data: { batch, estimate, model: CONFIG.openAiModel, llmFallback: CONFIG.llmFallback },
  }, { status: 201 });
}
