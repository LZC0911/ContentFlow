import { NextResponse } from "next/server";
import { items } from "@/lib/store";

export async function POST(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const it = await items.regenerate(params.id);
    return NextResponse.json({ data: it });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message.includes("额度不足") ? 402 : 400 });
  }
}
