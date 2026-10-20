import { NextResponse } from "next/server";
import { credits, CONFIG } from "@/lib/store";

export async function GET() {
  const c = credits.snapshot();
  return NextResponse.json({
    data: {
      ...c,
      available: (c.monthlyTotal - c.monthlyUsed) + c.addon - c.frozen,
      llmModel: CONFIG.openAiModel,
      llmFallback: CONFIG.llmFallback,
    },
  });
}
