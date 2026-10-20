import { NextResponse } from "next/server";
import { batches, items } from "@/lib/store";

/* GET /api/batches/:id — 批次详情 + 关联条目 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const b = batches.get(params.id);
  if (!b) return NextResponse.json({ error: "批次不存在" }, { status: 404 });
  const its = items.list(params.id);
  return NextResponse.json({ data: { batch: b, items: its } });
}
