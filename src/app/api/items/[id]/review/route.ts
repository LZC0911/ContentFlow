import { NextResponse } from "next/server";
import { z } from "zod";
import { items } from "@/lib/store";

const ReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const parsed = ReviewSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const it = await items.review(params.id, parsed.data.action, parsed.data.reason);
    return NextResponse.json({ data: it });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
