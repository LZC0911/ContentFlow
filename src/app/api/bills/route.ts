import { NextResponse } from "next/server";
import { bills } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ data: bills.list() });
}
