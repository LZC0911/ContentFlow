import { NextResponse } from "next/server";
import { batches } from "@/lib/store";

/* POST /api/batches/:id/cancel */
export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const b = await batches.cancel(params.id);
    return NextResponse.json({ data: b });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
