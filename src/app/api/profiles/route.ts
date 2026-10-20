import { NextResponse } from "next/server";
import { z } from "zod";
import { profiles } from "@/lib/store";

/* GET /api/profiles */
export async function GET() {
  return NextResponse.json({ data: profiles.list() });
}

/* POST /api/profiles */
const CreateSchema = z.object({
  name: z.string().min(2, "档案名称至少 2 字"),
  type: z.enum(["product", "store", "brand"]),
  category: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(1),
  audience: z.string().min(1),
  promo: z.string().optional(),
  tone: z.enum(["亲切", "专业", "高端", "活泼", "自定义"]),
  toneCustom: z.string().optional(),
  forbiddenWords: z.array(z.string()).optional().default([]),
  coverGradient: z.string().optional(),
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
  const p = profiles.create(parsed.data);
  return NextResponse.json({ data: p }, { status: 201 });
}
